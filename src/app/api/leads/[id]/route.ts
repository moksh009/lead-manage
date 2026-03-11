import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Outreach from '@/models/Outreach';

async function upsertOutreachField(date: Date, field: string, delta: number) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    await Outreach.findOneAndUpdate(
        { date: d },
        { $inc: { [field]: delta } },
        { upsert: true, new: true }
    );
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await dbConnect();
        const { id } = await params;
        const data = await request.json();

        // Get the current lead before updating
        const existing = await Lead.findById(id);
        if (!existing) {
            return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
        }


        // If the payload specifies pipelineStage directly (from Kanban board), use it.
        // Otherwise use the potentially auto-synced one.
        const newStage = data.pipelineStage;
        const leadDate = existing.leadDate || existing.createdAt || new Date();

        // Handle meeting auto-tracking
        // Handle meeting auto-tracking
        let meetingBounty = 0;
        let closedBounty = 0;

        if (newStage !== undefined && newStage !== existing.pipelineStage) {
            const isNowMeeting = ['meeting', 'meeting booked', 'meeting booked not convert', 'upcoming call', 'upcoming google-meet', 'no show up'].includes(newStage);
            const wasMeeting = existing.countedAsMeeting;

            if (isNowMeeting && !wasMeeting) {
                // Just moved to meeting — increment meetings
                await upsertOutreachField(leadDate, 'meetings', 1);
                data.countedAsMeeting = true;
                meetingBounty = 100;
            } else if (!isNowMeeting && wasMeeting) {
                // Moved away from meeting — decrement meetings
                await upsertOutreachField(leadDate, 'meetings', -1);
                data.countedAsMeeting = false;
                meetingBounty = -100;
            }

            const isNowClosed = ['closed', 'closed won', 'client'].includes(newStage);
            const wasClosed = existing.countedAsClosed;

            if (isNowClosed && !wasClosed) {
                // Just moved to closed — increment clientsClosed
                await upsertOutreachField(leadDate, 'clientsClosed', 1);
                data.countedAsClosed = true;
                closedBounty = 500;
                // If wasn't already counted as meeting, count it as meeting too
                if (!existing.countedAsMeeting && !data.countedAsMeeting) {
                    await upsertOutreachField(leadDate, 'meetings', 1);
                    data.countedAsMeeting = true;
                    meetingBounty += 100;
                }
            } else if (!isNowClosed && wasClosed) {
                // Moved away from closed — decrement clientsClosed
                await upsertOutreachField(leadDate, 'clientsClosed', -1);
                data.countedAsClosed = false;
                closedBounty = -500;
            }
        }

        const updated = await Lead.findByIdAndUpdate(id, data, { new: true });

        // --- Gamification Points (High-Stakes Bounties) ---
        const user = request.headers.get('x-user');
        if ((meetingBounty !== 0 || closedBounty !== 0) && (user === 'Moksh' || user === 'smit')) {
            const { awardGamificationPoints } = await import('@/lib/gamification');
            if (meetingBounty !== 0) {
                await awardGamificationPoints(user, meetingBounty > 0 ? 'BOUNTY_MEETING' : 'REVERT_MEETING', meetingBounty, meetingBounty > 0 ? `Bounty: Booked a meeting for ${existing.companyName}` : `Lost meeting status for ${existing.companyName}`);
            }
            if (closedBounty !== 0) {
                await awardGamificationPoints(user, closedBounty > 0 ? 'BOUNTY_CLOSED' : 'REVERT_CLOSED', closedBounty, closedBounty > 0 ? `Mega-Bounty: Secured new Client 🎉 (${existing.companyName})` : `Lost client status for ${existing.companyName}`);
            }
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

        // When deleting a lead, undo any counted contributions
        const lead = await Lead.findById(id);
        if (lead) {
            const leadDate = lead.leadDate || lead.createdAt || new Date();
            const CHANNEL_REPLY_FIELD: Record<string, string> = {
                dm: 'dmsReplies',
                email: 'emailReplies',
                whatsapp: 'whatsappReplies',
                call: 'callReplies',
            };
            if (lead.countedAsReply && CHANNEL_REPLY_FIELD[lead.channel]) {
                await upsertOutreachField(leadDate, CHANNEL_REPLY_FIELD[lead.channel], -1);
            }
            if (lead.countedAsMeeting) {
                await upsertOutreachField(leadDate, 'meetings', -1);
            }
            if (lead.countedAsClosed) {
                await upsertOutreachField(leadDate, 'clientsClosed', -1);
            }
        }

        await Lead.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
