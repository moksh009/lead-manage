import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BillingClient from '@/models/BillingClient';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const { amount, date, note } = await request.json();

        const client = await BillingClient.findByIdAndUpdate(
            id,
            {
                $push: {
                    payments: {
                        amount: Number(amount),
                        date: new Date(date),
                        note: note || '',
                    }
                }
            },
            { new: true }
        );

        if (!client) {
            return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: client });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const client = await BillingClient.findById(id);
        if (!client) {
            return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, payments: client.payments });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
