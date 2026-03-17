import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FomoLead from '@/models/FomoLead';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const body = await request.json();
        
        const fomoLead = await FomoLead.findByIdAndUpdate(
            id,
            { $set: body },
            { returnDocument: 'after' }
        ).populate('leadId');

        if (!fomoLead) {
            return NextResponse.json({ success: false, error: 'Re-engagement record not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: fomoLead });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        const deleted = await FomoLead.findByIdAndDelete(id);

        if (!deleted) {
             return NextResponse.json({ success: false, error: 'Re-engagement record not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Lead removed from re-engagement list' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
