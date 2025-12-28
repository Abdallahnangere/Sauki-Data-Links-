import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const plans = await prisma.dataPlan.findMany({
      orderBy: { price: 'asc' }
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Failed to fetch plans:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { network, data, validity, price, planId } = body;
    
    if (!network || !data || !price || !planId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const plan = await prisma.dataPlan.create({
      data: {
        network,
        data,
        validity: validity || '30 Days',
        price: Number(price),
        planId: Number(planId)
      }
    });
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Failed to create plan:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}