import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';
import { callAmigoAPI, AMIGO_NETWORKS } from '../../../../lib/amigo';

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
            // Don't fail, just return pending state so client retries
            return NextResponse.json({ status: 'pending' }); 
        }
    }

    // 4. If Status is PAID, Attempt Amigo Delivery via AWS Tunnel
    if (currentStatus === 'paid' && transaction.type === 'data') {
        if (!transaction.deliveryData) {
            const plan = await prisma.dataPlan.findUnique({ where: { id: transaction.planId! } });
            
            if (plan) {
                const networkId = AMIGO_NETWORKS[plan.network];

                const amigoPayload = {
                    network: networkId,
                    mobile_number: transaction.phone,
                    plan: Number(plan.planId),
                    Ported_number: true
                };

                // Call Amigo through the Tunnel
                const amigoRes = await callAmigoAPI('/data/', amigoPayload, tx_ref);

                if (amigoRes.success && (amigoRes.data.success === true || amigoRes.data.status === 'delivered')) {
                    await prisma.transaction.update({
                        where: { id: transaction.id },
                        data: {
                            status: 'delivered',
                            deliveryData: amigoRes.data
                        }
                    });
                    currentStatus = 'delivered';
                } else {
                    console.error('Amigo Delivery Failed via AWS:', amigoRes.data);
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