import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Outreach from '@/models/Outreach';

// POST: add/accumulate sent counts for a date
export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();

        const existingEntry = await Outreach.findOne({ date: new Date(data.date) });

        if (existingEntry) {
            // Accumulate (add on top of existing)
            existingEntry.dmsSent += Number(data.dmsSent) || 0;
            existingEntry.emailsSent += Number(data.emailsSent) || 0;
            existingEntry.whatsappSent += Number(data.whatsappSent) || 0;
            existingEntry.callsMade += Number(data.callsMade) || 0;
            await existingEntry.save();
            return NextResponse.json({ success: true, data: existingEntry });
        } else {
            const newEntry = await Outreach.create({
                date: new Date(data.date),
                dmsSent: Number(data.dmsSent) || 0,
                emailsSent: Number(data.emailsSent) || 0,
                whatsappSent: Number(data.whatsappSent) || 0,
                callsMade: Number(data.callsMade) || 0,
                dmsReplies: 0,
                emailReplies: 0,
                whatsappReplies: 0,
                callReplies: 0,
                meetings: 0,
                clientsClosed: 0,
            });
            return NextResponse.json({ success: true, data: newEntry }, { status: 201 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

// PATCH: set exact values (override, not accumulate) for a given date
export async function PATCH(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();

        const existing = await Outreach.findOne({ date: new Date(data.date) });
        if (!existing) {
            return NextResponse.json({ success: false, error: 'No entry found for this date' }, { status: 404 });
        }

        // Only update fields that were sent in the request
        const fields = ['dmsSent', 'emailsSent', 'whatsappSent', 'callsMade'];
        for (const f of fields) {
            if (data[f] !== undefined) existing[f] = Number(data[f]) || 0;
        }
        await existing.save();
        return NextResponse.json({ success: true, data: existing });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

// GET: aggregate + records + per-date query
export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');

        // If a specific date is requested, return only that record
        if (dateParam) {
            const record = await Outreach.findOne({ date: new Date(dateParam) });
            return NextResponse.json({ success: true, data: record || null });
        }

        const allOutreach = await Outreach.find({}).sort({ date: -1 });

        let totalSent = 0;
        let byChannel = { dms: 0, emails: 0, whatsapp: 0, calls: 0 };

        allOutreach.forEach(record => {
            totalSent += record.dmsSent + record.emailsSent + record.whatsappSent + record.callsMade;
            byChannel.dms += record.dmsSent;
            byChannel.emails += record.emailsSent;
            byChannel.whatsapp += record.whatsappSent;
            byChannel.calls += record.callsMade;
        });

        return NextResponse.json({
            success: true,
            aggregate: { totalSent, byChannel },
            records: allOutreach
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
