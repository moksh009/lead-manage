import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TeamGoal from '@/models/TeamGoal';

export async function GET() {
    try {
        await dbConnect();
        const goals = await TeamGoal.find({}).sort({ date: -1 });
        return NextResponse.json({ success: true, data: goals });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const data = await request.json();
        const goal = await TeamGoal.create(data);

        // --- Gamification Points ---
        const userRaw = data.user;
        const user = userRaw === 'Moksh' || userRaw === 'Moksh' ? 'Moksh' : 'smit';
        if (user === 'Moksh' || user === 'smit') {
            const { awardGamificationPoints } = await import('@/lib/gamification');

            // 1. Early Check-in Reward
            // Ex: "09:20 AM"
            const match = data.timeJoinedOffice?.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (match) {
                let hour = parseInt(match[1], 10);
                const min = parseInt(match[2], 10);
                const ampm = match[3].toUpperCase();
                if (ampm === 'PM' && hour < 12) hour += 12;
                if (ampm === 'AM' && hour === 12) hour = 0;

                // Target: <= 9:30 AM
                if ((hour < 9) || (hour === 9 && min <= 30)) {
                    await awardGamificationPoints(user, 'EARLY_CHECKIN', 10, `Checked in early at ${data.timeJoinedOffice}`);
                }
            }

            // 2. Initial Task Completions (if any)
            const completedTasks = data.tasks?.filter((t: any) => t.isCompleted)?.length || 0;
            if (completedTasks > 0) {
                await awardGamificationPoints(user, 'COMPLETE_TASK', completedTasks * 2, `Completed ${completedTasks} task(s)`);
            }
        }

        return NextResponse.json({ success: true, data: goal }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await dbConnect();
        const { id, ...updates } = await request.json();

        // Fetch existing to compare tasks
        const existing = await TeamGoal.findById(id);
        if (!existing) {
            return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
        }

        let newCompletions = 0;
        if (updates.tasks && Array.isArray(updates.tasks)) {
            updates.tasks.forEach((updatedTask: any) => {
                if (updatedTask.isCompleted) {
                    // check if it was incomplete before
                    const oldTask = existing.tasks.find((t: any) => t._id.toString() === updatedTask._id);
                    if (oldTask && !oldTask.isCompleted) {
                        newCompletions++;
                    }
                }
            });
        }

        const updated = await TeamGoal.findByIdAndUpdate(id, updates, { new: true });

        // --- Gamification Points ---
        const userRaw = request.headers.get('x-user') || existing.user;
        const user = userRaw === 'Moksh' || userRaw === 'Moksh' ? 'Moksh' : 'smit';
        if (newCompletions > 0 && (user === 'Moksh' || user === 'smit')) {
            const { awardGamificationPoints } = await import('@/lib/gamification');
            await awardGamificationPoints(user, 'COMPLETE_TASK', newCompletions * 2, `Completed ${newCompletions} task(s)`);
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
