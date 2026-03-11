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
            const sumAdded = (Number(data.dmsSent) || 0) + (Number(data.emailsSent) || 0) + (Number(data.whatsappSent) || 0) + (Number(data.callsMade) || 0);

            existingEntry.dmsSent += Number(data.dmsSent) || 0;
            existingEntry.emailsSent += Number(data.emailsSent) || 0;
            existingEntry.whatsappSent += Number(data.whatsappSent) || 0;
            existingEntry.callsMade += Number(data.callsMade) || 0;
            await existingEntry.save();

            // --- Gamification Points ---
            const user = request.headers.get('x-user');
            if (sumAdded > 0 && (user === 'Moksh' || user === 'smit')) {
                const pointsToAward = Math.floor(sumAdded / 10);
                if (pointsToAward > 0) {
                    const { awardGamificationPoints } = await import('@/lib/gamification');
                    await awardGamificationPoints(user, 'ADD_OUTREACH', pointsToAward, `Sent +${sumAdded} new outreach messages`);
                }
            }

            return NextResponse.json({ success: true, data: existingEntry });
        } else {
            const sumAdded = (Number(data.dmsSent) || 0) + (Number(data.emailsSent) || 0) + (Number(data.whatsappSent) || 0) + (Number(data.callsMade) || 0);
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

            // --- Gamification Points ---
            const user = request.headers.get('x-user');
            if (sumAdded > 0 && (user === 'Moksh' || user === 'smit')) {
                const pointsToAward = Math.floor(sumAdded / 10);
                if (pointsToAward > 0) {
                    const { awardGamificationPoints } = await import('@/lib/gamification');
                    await awardGamificationPoints(user, 'ADD_OUTREACH', pointsToAward, `Sent ${sumAdded} outreach messages`);
                }
            }

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
        const fields: Array<keyof typeof existing> = ['dmsSent', 'emailsSent', 'whatsappSent', 'callsMade'];
        let sumAdded = 0;

        for (const f of fields) {
            if (data[f] !== undefined) {
                const newVal = Number(data[f]) || 0;
                const oldVal = existing[f] as number;
                if (newVal > oldVal) {
                    sumAdded += (newVal - oldVal);
                }
                existing[f] = newVal;
            }
        }
        await existing.save();

        // --- Gamification Points ---
        const user = request.headers.get('x-user');
        if (sumAdded > 0 && (user === 'Moksh' || user === 'smit')) {
            const pointsToAward = Math.floor(sumAdded / 10);
            if (pointsToAward > 0) {
                const Point = (await import('@/models/Point')).default;
                await Point.create({
                    user, action: 'ADD_OUTREACH', points: pointsToAward,
                    description: `Updated log: +${sumAdded} outreach messages`, date: new Date()
                });
            }
        }

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
