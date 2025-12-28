import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Amigo Network Mapping
const AMIGO_NETWORKS: Record<string, number> = {
  'MTN': 1,
  'GLO': 2,
  'AIRTEL': 3,
  '9MOBILE': 4
};

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phone, planId, password } = body;

        // Secure this endpoint
        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const plan = await prisma.dataPlan.findUnique({ where: { id: planId } });
        if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

        const networkId = AMIGO_NETWORKS[plan.network];
        
        // Call Amigo Directly
        const amigoPayload = {
            network: networkId,
            mobile_number: phone,
            plan: plan.planId,
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

        const tx_ref = `ADMIN-MANUAL-${uuidv4().slice(0,8)}`;
        
        // Log transaction as Delivered (Manual)
        const transaction = await prisma.transaction.create({
            data: {
                tx_ref,
                type: 'data',
                status: amigoRes.data.success || amigoRes.data.status === 'delivered' ? 'delivered' : 'failed',
                phone,
                amount: 0, // Admin override
                planId: plan.id,
                deliveryData: amigoRes.data,
                paymentData: { method: 'Manual Admin Topup' }
            }
        });

        if (transaction.status === 'failed') {
            return NextResponse.json({ error: 'Amigo API Failed', details: amigoRes.data }, { status: 400 });
        }

        return NextResponse.json({ success: true, transaction });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}