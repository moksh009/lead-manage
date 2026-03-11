import TeamGoal from '@/models/TeamGoal';

export async function getUserMultiplier(user: string): Promise<number> {
    try {
        // Case-insensitive match for the user to handle 'Moksh' vs 'Moksh'
        const goals = await TeamGoal.find({ user: { $regex: new RegExp(`^${user}$`, 'i') } })
            .sort({ date: -1 })
            .limit(10);

        if (goals.length < 3) return 1.0;

        let earlyStreak = 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const mostRecentDate = new Date(goals[0].date);
        mostRecentDate.setHours(0, 0, 0, 0);

        // If the most recent check-in is older than yesterday, the streak is broken
        const diffDays = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays > 1) {
            return 1.0;
        }

        let currentDate = mostRecentDate;

        for (const goal of goals) {
            const d = new Date(goal.date);
            d.setHours(0, 0, 0, 0);

            // Check for gap in consecutive days (0 is same day, 1 is next consecutive day)
            const diff = Math.floor((currentDate.getTime() - d.getTime()) / (1000 * 3600 * 24));
            if (diff > 1) {
                break; // Gap found, streak broken
            }
            currentDate = d;

            // Check if they were early
            const match = goal.timeJoinedOffice?.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (match) {
                let hour = parseInt(match[1], 10);
                const min = parseInt(match[2], 10);
                const ampm = match[3].toUpperCase();
                if (ampm === 'PM' && hour < 12) hour += 12;
                if (ampm === 'AM' && hour === 12) hour = 0;

                // Early is <= 9:30 AM
                if ((hour < 9) || (hour === 9 && min <= 30)) {
                    earlyStreak++;
                } else {
                    break; // Late check-in breaks the streak backwards
                }
            } else {
                break; // Invalid time breaks streak
            }
        }

        return earlyStreak >= 3 ? 1.5 : 1.0;
    } catch (e) {
        console.error("Error calculating multiplier:", e);
        return 1.0;
    }
}

export async function awardGamificationPoints(user: string, action: string, basePoints: number, description: string) {
    if (user !== 'Moksh' && user !== 'smit' || basePoints === 0) return;

    const multiplier = await getUserMultiplier(user);
    const awarded = Math.floor(basePoints * multiplier);

    // Don't add fire emoji if points are negative (e.g. lost bounty)
    const isFire = multiplier > 1.0 && basePoints > 0;
    const finalDesc = `${description}${isFire ? ' (🔥 1.5x Multiplier)' : ''}`;

    const Point = (await import('@/models/Point')).default;
    await Point.create({
        user,
        action,
        points: awarded,
        description: finalDesc,
        date: new Date()
    });
}
