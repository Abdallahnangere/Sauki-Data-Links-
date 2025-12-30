import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { callAmigoAPI, AMIGO_NETWORKS } from '../../../../lib/amigo';

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
        const idempotencyKey = `MANUAL-${uuidv4()}`;
        
        const amigoPayload = {
            network: networkId,
            mobile_number: phone,
            plan: Number(plan.planId),
            Ported_number: true
        };

        // Call Amigo through AWS Tunnel
        const amigoRes = await callAmigoAPI('/data/', amigoPayload, idempotencyKey);

        const tx_ref = idempotencyKey;
        
        // Log transaction as Delivered (Manual)
        const transaction = await prisma.transaction.create({
            data: {
                tx_ref,
                type: 'data',
                status: (amigoRes.success && (amigoRes.data.success || amigoRes.data.status === 'delivered')) ? 'delivered' : 'failed',
                phone,
                amount: 0, // Admin override
                planId: plan.id,
                deliveryData: amigoRes.data,
                paymentData: { method: 'Manual Admin Topup' }
            }
        });

        if (transaction.status === 'failed') {
            return NextResponse.json({ error: 'Amigo API Failed via Tunnel', details: amigoRes.data }, { status: 400 });
        }

        return NextResponse.json({ success: true, transaction });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
    }
}