import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { endpoint, payload, password } = body;

        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const baseUrl = process.env.AMIGO_BASE_URL?.replace(/\/$/, '') || '';
        const targetUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

        console.log(`Console Proxying to: ${targetUrl}`);

        const response = await axios.post(targetUrl, payload, {
            headers: {
                'X-API-Key': process.env.AMIGO_API_KEY,
                'Content-Type': 'application/json',
                // Add a random idempotency key for console tests to allow re-sends
                'Idempotency-Key': `CONSOLE-${Date.now()}` 
            }
        });

        return NextResponse.json(response.data);

    } catch (e: any) {
        return NextResponse.json(
            e.response?.data || { error: e.message }, 
            { status: e.response?.status || 500 }
        );
    }
}

export async function GET(req: Request) {
    // Handling GET requests (e.g. for efficiency/balance checks)
    try {
        const { searchParams } = new URL(req.url);
        const endpoint = searchParams.get('endpoint');
        const password = searchParams.get('password');

        if (password !== process.env.ADMIN_PASSWORD) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        if (!endpoint) return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });

        const baseUrl = process.env.AMIGO_BASE_URL?.replace(/\/$/, '') || '';
        const targetUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

        const response = await axios.get(targetUrl, {
            headers: {
                'X-API-Key': process.env.AMIGO_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        return NextResponse.json(response.data);

    } catch (e: any) {
        return NextResponse.json(
            e.response?.data || { error: e.message }, 
            { status: e.response?.status || 500 }
        );
    }
}