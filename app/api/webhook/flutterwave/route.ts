import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';

const AMIGO_NETWORKS: Record<string, number> = {
  'MTN': 1,
  'GLO': 2,
  'AIRTEL': 3,
  '9MOBILE': 4
};

export async function POST(req: Request) {
  // 1. Verify Signature
  const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
  const signature = req.headers.get('verif-hash');

  if (!signature || signature !== secret) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2. Parse Body
  const body = await req.json();
  const payload = body.data || body; 
  const { txRef, status } = payload; 
  const reference = txRef || payload.tx_ref;

  // 3. Strict Success Check
  if (status !== 'successful') {
     return NextResponse.json({ received: true });
  }

  try {
    // 4. Find Transaction
    const transaction = await prisma.transaction.findUnique({ where: { tx_ref: reference } });
    
    if (!transaction) {
        console.log(`Webhook: Transaction ${reference} not found.`);
        return NextResponse.json({ error: 'Tx not found' }, { status: 404 });
    }

    // 5. Process Payment if not already processed
    if (transaction.status === 'pending') {
        // Mark as PAID first
        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: 'paid' }
        });
        
        // 6. DELIVER DATA (If it's a data transaction)
        if (transaction.type === 'data') {
             const plan = await prisma.dataPlan.findUnique({ where: { id: transaction.planId! } });
             
             if (plan) {
                 const networkId = AMIGO_NETWORKS[plan.network];
                 
                 try {
                    const amigoPayload = {
                        network: networkId,
                        mobile_number: transaction.phone,
                        plan: Number(plan.planId),
                        Ported_number: true
                    };

                    const baseUrl = process.env.AMIGO_BASE_URL?.replace(/\/$/, '') || '';

                    const amigoRes = await axios.post(
                        `${baseUrl}/data/`,
                        amigoPayload,
                        {
                            headers: {
                                'X-API-Key': process.env.AMIGO_API_KEY,
                                'Content-Type': 'application/json',
                                'Idempotency-Key': reference // Ensure we don't double charge on retry
                            }
                        }
                    );
                    
                    if (amigoRes.data.success === true || amigoRes.data.status === 'delivered') {
                        await prisma.transaction.update({
                            where: { id: transaction.id },
                            data: { 
                                status: 'delivered', 
                                deliveryData: amigoRes.data 
                            }
                        });
                        console.log(`Webhook: Data delivered for ${reference}`);
                    } else {
                        console.error(`Webhook: Amigo failed for ${reference}`, amigoRes.data);
                    }
                 } catch (e: any) {
                     console.error("Webhook: Amigo API Error", e?.response?.data || e.message);
                 }
             }
        }
    }
  } catch (error) {
      console.error('Webhook Error', error);
  }

  return NextResponse.json({ received: true });
}