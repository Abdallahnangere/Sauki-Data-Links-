import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';

// Amigo Network Mapping
const AMIGO_NETWORKS: Record<string, number> = {
  'MTN': 1,
  'GLO': 2,
  'AIRTEL': 3,
  '9MOBILE': 4
};

export async function POST(req: Request) {
  try {
    const { tx_ref } = await req.json();
    
    // 1. Get Transaction from DB
    const transaction = await prisma.transaction.findUnique({ where: { tx_ref } });
    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });

    // 2. If already delivered, return immediately
    if (transaction.status === 'delivered') return NextResponse.json({ status: 'delivered' });
    
    let currentStatus = transaction.status;

    // 3. If Pending, Verify with Flutterwave
    if (currentStatus === 'pending') {
        try {
            const flwVerify = await axios.get(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`, {
                headers: { Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}` }
            });

            const flwData = flwVerify.data.data;

            if (flwVerify.data.status === 'success' && flwData.status === 'successful' && flwData.amount >= transaction.amount) {
                // Update to PAID
                await prisma.transaction.update({
                    where: { id: transaction.id },
                    data: { status: 'paid' }
                });
                currentStatus = 'paid';
            }
        } catch (error) {
            console.error('FLW Verify Error:', error);
            return NextResponse.json({ status: 'pending' }); 
        }
    }

    // 4. If Status is PAID, Attempt Amigo Delivery
    if (currentStatus === 'paid' && transaction.type === 'data') {
        if (!transaction.deliveryData) {
            const plan = await prisma.dataPlan.findUnique({ where: { id: transaction.planId! } });
            
            if (plan) {
                const networkId = AMIGO_NETWORKS[plan.network];

                try {
                    console.log(`Attempting Amigo Delivery for ${tx_ref}`);
                    
                    const amigoPayload = {
                        network: networkId,
                        mobile_number: transaction.phone,
                        plan: Number(plan.planId), // Ensure integer
                        Ported_number: true
                    };

                    const baseUrl = process.env.AMIGO_BASE_URL?.replace(/\/$/, '') || ''; // Remove trailing slash if present

                    const amigoRes = await axios.post(
                        `${baseUrl}/data/`,
                        amigoPayload,
                        {
                            headers: {
                                'X-API-Key': process.env.AMIGO_API_KEY,
                                'Content-Type': 'application/json',
                                'Idempotency-Key': tx_ref // Use tx_ref for safe retries
                            }
                        }
                    );

                    // Check Amigo response
                    if (amigoRes.data.success === true || amigoRes.data.status === 'delivered') {
                        await prisma.transaction.update({
                            where: { id: transaction.id },
                            data: {
                                status: 'delivered',
                                deliveryData: amigoRes.data
                            }
                        });
                        currentStatus = 'delivered';
                    } else {
                        console.error('Amigo Delivery Failed:', amigoRes.data);
                    }
                } catch (amigoError: any) {
                    console.error('Amigo API Network Error:', amigoError?.response?.data || amigoError.message);
                }
            }
        }
    }

    return NextResponse.json({ status: currentStatus });

  } catch (error) {
    console.error('Verification System Error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}