"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/components/UserContext';
import { formatDistanceToNowStrict, endOfMonth } from 'date-fns';

function getRank(score: number) {
    if (score >= 5000) return 'Apex Closer 🐉';
    if (score >= 1000) return 'Rainmaker ⚡️';
    if (score >= 250) return 'Hustler 🏃‍♂️';
    return 'Rookie 🐣';
}

function getRankBadgeStyle(score: number) {
    if (score >= 5000) return { background: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 100%)', color: '#000' };
    if (score >= 1000) return { background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)', color: '#fff' };
    if (score >= 250) return { background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)', color: '#fff' };
    return { background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' };
}

export default function RewardsPage() {
    const { currentUser } = useUser();
    const [points, setPoints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        fetch('/api/rewards')
            .then(res => res.json())
            .then(json => {
                if (json.success) setPoints(json.data);
                setLoading(false);
            });

        const updateTimer = () => {
            const end = endOfMonth(new Date());
            // Need to set hours to end of day
            end.setHours(23, 59, 59, 999);
            setTimeLeft(formatDistanceToNowStrict(end));
        };
        updateTimer();
        const timer = setInterval(updateTimer, 60000);
        return () => clearInterval(timer);
    }, []);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // Use createdAt because date is often explicitly set to past dates during sync
    const monthPoints = points.filter(p => new Date(p.date || p.createdAt).getTime() >= monthStart);
    const dailyPoints = points.filter(p => new Date(p.date || p.createdAt).getTime() >= todayStart);

    // Month Math
    const mokshMonthScore = monthPoints.filter(p => p.user?.toUpperCase() === 'MOKSH').reduce((sum, p) => sum + p.points, 0);
    const smitMonthScore = monthPoints.filter(p => p.user?.toLowerCase() === 'smit').reduce((sum, p) => sum + p.points, 0);
    const monthLeader = mokshMonthScore > smitMonthScore ? 'MOKSH' : smitMonthScore > mokshMonthScore ? 'smit' : 'Tie';

    // Daily Math
    const mokshDailyScore = dailyPoints.filter(p => p.user?.toUpperCase() === 'MOKSH').reduce((sum, p) => sum + p.points, 0);
    const smitDailyScore = dailyPoints.filter(p => p.user?.toLowerCase() === 'smit').reduce((sum, p) => sum + p.points, 0);
    const dailyLeader = mokshDailyScore > smitDailyScore ? 'MOKSH' : smitDailyScore > mokshDailyScore ? 'smit' : 'Tie';

    return (
        <div className="animate-in">
            {/* Dark glassmorphic hero */}
            <div className="card" style={{ marginBottom: 32, padding: '32px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ fontSize: '1.5rem', padding: '6px', background: 'rgba(168,85,247,0.1)', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.2)' }}>👑</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', padding: '3px 12px', borderRadius: 99, color: '#d8b4fe' }}>Gamification Scoreboard</span>
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px 0', background: 'linear-gradient(to right, #ffffff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Founder Rewards</h1>
                        <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Gamification scoreboard for Moksh vs Smit</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px 24px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'right', backdropFilter: 'blur(10px)' }}>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Time Until Month Reset</div>
                        <div style={{ color: 'white', fontSize: '1.75rem', fontWeight: 900, fontFamily: 'monospace' }}>⏳ {timeLeft} left</div>
                    </div>
                </div>
            </div>

            {/* Daily Head-to-Head */}
            <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>🥊</span> Win The Day <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: 12 }}>Resets at Midnight</span>
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                    {/* Moksh Daily */}
                    <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: dailyLeader === 'MOKSH' ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.03)', border: dailyLeader === 'MOKSH' ? '2px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.07)', boxShadow: dailyLeader === 'MOKSH' ? '0 0 30px -8px rgba(168,85,247,0.25)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="avatar avatar-md avatar-gradient-1">M</div>
                            <div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>Moksh</div>
                                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>Today&apos;s Hustle</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: dailyLeader === 'MOKSH' ? '#d8b4fe' : 'rgba(255,255,255,0.7)' }}>{mokshDailyScore}</div>
                    </div>

                    {/* Smit Daily */}
                    <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: dailyLeader === 'smit' ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: dailyLeader === 'smit' ? '2px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.07)', boxShadow: dailyLeader === 'smit' ? '0 0 30px -8px rgba(16,185,129,0.25)' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="avatar avatar-md avatar-gradient-2">S</div>
                            <div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>Smit</div>
                                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>Today&apos;s Hustle</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: dailyLeader === 'smit' ? '#34d399' : 'rgba(255,255,255,0.7)' }}>{smitDailyScore}</div>
                    </div>
                </div>
            </div>

            {/* Monthly Championship Scoreboard */}
            <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>🏆</span> Current Month Championship
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                    {/* Moksh Scorecard */}
                    <div className="card" style={{ padding: 32, textAlign: 'center', background: monthLeader === 'MOKSH' ? 'rgba(168,85,247,0.08)' : 'rgba(255,255,255,0.03)', border: monthLeader === 'MOKSH' ? '2px solid rgba(168,85,247,0.4)' : '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden', boxShadow: monthLeader === 'MOKSH' ? '0 0 40px -10px rgba(168,85,247,0.3)' : 'none' }}>
                        {monthLeader === 'MOKSH' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--accent-gradient)' }} />}
                        <div className="avatar avatar-lg avatar-gradient-1" style={{ margin: '0 auto 16px' }}>M</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4, color: 'rgba(255,255,255,0.9)' }}>Moksh</div>
                        <div style={{ margin: '8px auto 16px', display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: '0.8125rem', fontWeight: 800, ...getRankBadgeStyle(mokshMonthScore) }}>
                            {getRank(mokshMonthScore)}
                        </div>
                        <div style={{ fontSize: '4rem', fontWeight: 900, color: '#d8b4fe', lineHeight: 1 }}>{mokshMonthScore}</div>
                        <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>Monthly Points</div>
                    </div>

                    {/* Smit Scorecard */}
                    <div className="card" style={{ padding: 32, textAlign: 'center', background: monthLeader === 'smit' ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)', border: monthLeader === 'smit' ? '2px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.07)', position: 'relative', overflow: 'hidden', boxShadow: monthLeader === 'smit' ? '0 0 40px -10px rgba(16,185,129,0.3)' : 'none' }}>
                        {monthLeader === 'smit' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(135deg, #10b981, #34d399)' }} />}
                        <div className="avatar avatar-lg avatar-gradient-2" style={{ margin: '0 auto 16px' }}>S</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4, color: 'rgba(255,255,255,0.9)' }}>Smit</div>
                        <div style={{ margin: '8px auto 16px', display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: '0.8125rem', fontWeight: 800, ...getRankBadgeStyle(smitMonthScore) }}>
                            {getRank(smitMonthScore)}
                        </div>
                        <div style={{ fontSize: '4rem', fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{smitMonthScore}</div>
                        <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>Monthly Points</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }}>
                {/* Live Activity Feed */}
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16 }}>Live Activity Feed</h2>
                    <div className="card">
                        {loading ? (
                            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading activity feed...</div>
                        ) : points.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>No points awarded yet. Start adding leads!</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {points.slice(0, 50).map((point, i) => {
                                    const isBounty = point.action?.includes('BOUNTY');
                                    const isMoksh = point.user?.toUpperCase() === 'MOKSH';

                                    return (
                                        <div key={point._id} style={{ padding: '16px 24px', borderBottom: i < points.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 16, background: isBounty ? 'var(--bg-secondary)' : 'transparent' }}>
                                            <div className={`avatar avatar-sm ${isMoksh ? 'avatar-gradient-1' : 'avatar-gradient-2'}`}>{point.user?.[0]?.toUpperCase()}</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    <span style={{ textTransform: 'capitalize' }}>{point.user}</span> earned <span style={{ color: point.points > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: isBounty ? 800 : 600 }}>{point.points > 0 ? '+' : ''}{point.points} points</span>
                                                    {isBounty && <span style={{ marginLeft: 8, fontSize: '0.75rem', padding: '2px 6px', background: 'var(--accent)', color: 'white', borderRadius: 8, textTransform: 'uppercase', fontWeight: 800 }}>Bounty</span>}
                                                </div>
                                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 2 }}>{point.description}</div>
                                            </div>
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                                                {new Date(point.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Hall of Fame */}
                <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>🏛️</span> Hall of Fame
                    </h2>
                    <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏆</div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, marginBottom: 8 }}>Past Champions</h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            At the end of the month, the winner will be permanently engraved here.
                        </p>
                        
                        <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', fontWeight: 800, marginBottom: 4 }}>Next Induction</div>
                            <div style={{ fontWeight: 600 }}>{endOfMonth(new Date()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
