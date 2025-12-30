import { NextResponse } from 'next/server';
import { callAmigoAPI } from '../../../../lib/amigo';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { endpoint, payload, password } = body;

        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Generate a test idempotency key
        const idempotencyKey = `CONSOLE-${Date.now()}`;
        
        console.log(`[Console] Proxying to endpoint: ${endpoint}`);

        // Use the centralized tunnel client
        const result = await callAmigoAPI(endpoint, payload, idempotencyKey);

        // Return the exact response from the tunnel/Amigo
        if (!result.success) {
            return NextResponse.json(result.data, { status: result.status });
        }

        return NextResponse.json(result.data);

    } catch (e: any) {
        return NextResponse.json(
            { error: e.message }, 
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    return NextResponse.json({ error: 'Console GET not supported via Tunnel Client yet. Use POST.' }, { status: 400 });
}