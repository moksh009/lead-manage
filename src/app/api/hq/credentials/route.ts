import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HQCredential from '@/models/HQCredential';

export async function GET() {
    try {
        await connectDB();
        // Return credentials sorted alphabetically by platform
        const credentials = await HQCredential.find().sort({ platform: 1 });
        return NextResponse.json({ success: true, data: credentials });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        
        if (!body.platform || !body.username) {
             return NextResponse.json({ success: false, error: 'Platform and username are required' }, { status: 400 });
        }

        const credential = await HQCredential.create(body);
        return NextResponse.json({ success: true, data: credential }, { status: 201 });
    } catch (error: unknown) {
        return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
    }
}
