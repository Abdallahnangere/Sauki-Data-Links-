import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(req: Request) {
    try {
        const { password } = await req.json();

        // Security Check
        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete all transactions
        await prisma.transaction.deleteMany({});
        
        return NextResponse.json({ success: true, message: 'Transaction history wiped.' });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to clear history' }, { status: 500 });
    }
}