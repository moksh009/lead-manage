import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Outreach from '@/models/Outreach';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();

        const existingEntry = await Outreach.findOne({ date: new Date(data.date) });

        if (existingEntry) {
            existingEntry.dmsSent += Number(data.dmsSent) || 0;
            existingEntry.emailsSent += Number(data.emailsSent) || 0;
            existingEntry.whatsappSent += Number(data.whatsappSent) || 0;
            existingEntry.callsMade += Number(data.callsMade) || 0;
            existingEntry.dmsReplies += Number(data.dmsReplies) || 0;
            existingEntry.emailReplies += Number(data.emailReplies) || 0;
            existingEntry.whatsappReplies += Number(data.whatsappReplies) || 0;
            existingEntry.callReplies += Number(data.callReplies) || 0;
            existingEntry.meetings += Number(data.meetings) || 0;
            existingEntry.clientsClosed += Number(data.clientsClosed) || 0;
            await existingEntry.save();
            return NextResponse.json({ success: true, data: existingEntry });
        } else {
            const newEntry = await Outreach.create({
                date: new Date(data.date),
                dmsSent: Number(data.dmsSent) || 0,
                emailsSent: Number(data.emailsSent) || 0,
                whatsappSent: Number(data.whatsappSent) || 0,
                callsMade: Number(data.callsMade) || 0,
                dmsReplies: Number(data.dmsReplies) || 0,
                emailReplies: Number(data.emailReplies) || 0,
                whatsappReplies: Number(data.whatsappReplies) || 0,
                callReplies: Number(data.callReplies) || 0,
                meetings: Number(data.meetings) || 0,
                clientsClosed: Number(data.clientsClosed) || 0,
            });
            return NextResponse.json({ success: true, data: newEntry }, { status: 201 });
        }
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const allOutreach = await Outreach.find({}).sort({ date: -1 });

        let totalSent = 0;
        let byChannel = { dms: 0, emails: 0, whatsapp: 0, calls: 0 };
        let totalReplies = 0;
        let meetings = 0;
        let clients = 0;
        let repliesByChannel = { dms: 0, emails: 0, whatsapp: 0, calls: 0 };

        allOutreach.forEach(record => {
            totalSent += record.dmsSent + record.emailsSent + record.whatsappSent + record.callsMade;
            byChannel.dms += record.dmsSent;
            byChannel.emails += record.emailsSent;
            byChannel.whatsapp += record.whatsappSent;
            byChannel.calls += record.callsMade;

            const recReplies = (record.dmsReplies || 0) + (record.emailReplies || 0) + (record.whatsappReplies || 0) + (record.callReplies || 0);
            totalReplies += recReplies;
            repliesByChannel.dms += record.dmsReplies || 0;
            repliesByChannel.emails += record.emailReplies || 0;
            repliesByChannel.whatsapp += record.whatsappReplies || 0;
            repliesByChannel.calls += record.callReplies || 0;

            meetings += record.meetings;
            clients += record.clientsClosed;
        });

        return NextResponse.json({
            success: true,
            aggregate: { totalSent, byChannel, replies: totalReplies, repliesByChannel, meetings, clients },
            records: allOutreach
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
