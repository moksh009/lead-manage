import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BillingClient from '@/models/BillingClient';

export async function GET() {
    try {
        await dbConnect();
        const clients = await BillingClient.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: clients });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();
        // Auto-compute monthlyFee from services sum if services provided
        if (Array.isArray(data.services) && data.services.length > 0) {
            data.monthlyFee = data.services.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0);
        }
        const client = await BillingClient.create(data);
        return NextResponse.json({ success: true, data: client }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
