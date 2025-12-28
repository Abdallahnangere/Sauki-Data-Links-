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
  // Flutterwave webhook payload structure varies slightly by event, but usually data is inside `data`
  const payload = body.data || body; 
  const { txRef, status } = payload; 
  // Note: Flutterwave often sends `txRef` or `tx_ref`. Check strictly.
  const reference = txRef || payload.tx_ref;

  // 3. Strict Success Check
  if (status !== 'successful') {
     return NextResponse.json({ received: true });
  }

  try {
    // 4. Find Transaction
    const transaction = await prisma.transaction.findUnique({ where: { tx_ref: reference } });
    
    if (!transaction) {
        // Transaction not found? Log it.
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
                        plan: plan.planId, // Amigo Plan ID (Integer)
                        Ported_number: true
                    };

                    const amigoRes = await axios.post(
                        `${process.env.AMIGO_BASE_URL}/data/`,
                        amigoPayload,
                        {
                            headers: {
                                'X-API-Key': process.env.AMIGO_API_KEY,
                                'Content-Type': 'application/json'
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