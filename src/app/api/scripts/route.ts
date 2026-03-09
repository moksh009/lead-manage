import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Script from '@/models/Script';

export async function GET() {
    try {
        await dbConnect();
        const scripts = await Script.find({}).sort({ updatedAt: -1 });
        return NextResponse.json({ success: true, data: scripts });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();
        const script = await Script.create(data);
        return NextResponse.json({ success: true, data: script }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
