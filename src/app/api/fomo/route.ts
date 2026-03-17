import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FomoLead from '@/models/FomoLead';
import '@/models/Lead'; // Ensure Lead model is registered

export async function GET() {
    try {
        await connectDB();
        const fomoLeads = await FomoLead.find({})
            .populate('leadId')
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: fomoLeads });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();

        if (!body.leadId) {
            return NextResponse.json({ success: false, error: 'Lead ID is required' }, { status: 400 });
        }

        // Check if already exists to prevent duplicates
        const existing = await FomoLead.findOne({ leadId: body.leadId });
        if (existing) {
            return NextResponse.json({ success: false, error: 'Lead is already in the re-engagement list' }, { status: 400 });
        }

        const fomoLead = await FomoLead.create({
            leadId: body.leadId,
            notes: body.notes || ''
        });

        const populated = await fomoLead.populate('leadId');

        return NextResponse.json({ success: true, data: populated }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        await connectDB();
        await FomoLead.deleteMany({});
        return NextResponse.json({ success: true, message: 'Re-engagement list cleared' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
