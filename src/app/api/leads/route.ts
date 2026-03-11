import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Outreach from '@/models/Outreach';

// Map channel → outreach reply field
const CHANNEL_REPLY_FIELD: Record<string, string> = {
    dm: 'dmsReplies',
    email: 'emailReplies',
    whatsapp: 'whatsappReplies',
    call: 'callReplies',
};

async function upsertOutreachField(date: Date, field: string, delta: number) {
    // Normalize the date to midnight UTC for the daily record key
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    await Outreach.findOneAndUpdate(
        { date: d },
        { $inc: { [field]: delta } },
        { upsert: true, new: true }
    );
}

export async function GET(request: NextRequest) {
    try {
        await dbConnect();
        const leads = await Lead.find({}).sort({ updatedAt: -1 });
        return NextResponse.json({ success: true, data: leads });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();

        // Set leadDate to the provided date or today
        const leadDate = data.leadDate ? new Date(data.leadDate) : new Date();

        // Create the lead
        const lead = await Lead.create({
            ...data,
            leadDate,
            countedAsReply: true, // will be counted below
            countedAsMeeting: false,
            countedAsClosed: false,
        });

        // Auto-increment reply for this channel+date in the outreach log
        const replyField = CHANNEL_REPLY_FIELD[data.channel || 'call'];
        if (replyField) {
            await upsertOutreachField(leadDate, replyField, 1);
        }

        // --- Gamification Points ---
        const user = request.headers.get('x-user');
        if (user === 'Moksh' || user === 'smit') {
            const { awardGamificationPoints } = await import('@/lib/gamification');
            await awardGamificationPoints(user, 'ADD_LEAD', 5, `Added a new lead: ${data.companyName}`);
        }

        return NextResponse.json({ success: true, data: lead }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
