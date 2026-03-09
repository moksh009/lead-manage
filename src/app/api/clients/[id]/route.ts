import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BillingClient from '@/models/BillingClient';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const data = await request.json();

        // Recalculate monthlyFee from services if services are provided
        if (Array.isArray(data.services)) {
            data.monthlyFee = data.services.reduce((sum: number, s: any) => sum + (Number(s.price) || 0), 0);
        }

        const updated = await BillingClient.findByIdAndUpdate(id, data, { new: true });
        if (!updated) {
            return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        await BillingClient.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
