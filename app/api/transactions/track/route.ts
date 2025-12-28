import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');

  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 });

  try {
    const transactions = await prisma.transaction.findMany({
      where: { phone },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        product: true,
        dataPlan: true
      }
    });
    return NextResponse.json({ transactions });
  } catch (error) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
  }
}