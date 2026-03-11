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
            <div className="page-hero" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)', marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24, alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '2rem', marginBottom: 8 }}>👑</div>
                        <h1 className="page-hero-title">Founder Rewards</h1>
                        <p className="page-hero-sub">Gamification scoreboard for Moksh vs Smit</p>
                    </div>
                    
                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px 24px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Time Until Month Reset</div>
                        <div style={{ color: 'white', fontSize: '2rem', fontWeight: 900, fontFamily: 'monospace' }}>
                            ⏳ {timeLeft} left
                        </div>
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
                    <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: dailyLeader === 'MOKSH' ? 'linear-gradient(to right, #fdf4ff, #ffffff)' : 'white', border: dailyLeader === 'MOKSH' ? '2px solid var(--accent)' : '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="avatar avatar-md avatar-gradient-1">M</div>
                            <div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>Moksh</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Today&apos;s Hustle</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: dailyLeader === 'MOKSH' ? 'var(--accent)' : 'var(--text-primary)' }}>{mokshDailyScore}</div>
                    </div>

                    {/* Smit Daily */}
                    <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: dailyLeader === 'smit' ? 'linear-gradient(to right, #f0fdf4, #ffffff)' : 'white', border: dailyLeader === 'smit' ? '2px solid var(--success)' : '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <div className="avatar avatar-md avatar-gradient-2">S</div>
                            <div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 800 }}>Smit</div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Today&apos;s Hustle</div>
                            </div>
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: dailyLeader === 'smit' ? 'var(--success)' : 'var(--text-primary)' }}>{smitDailyScore}</div>
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
                    <div className="card" style={{ padding: 32, textAlign: 'center', background: monthLeader === 'MOKSH' ? 'linear-gradient(to bottom, #fdf4ff, #ffffff)' : 'white', border: monthLeader === 'MOKSH' ? '2px solid var(--accent)' : '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                        {monthLeader === 'MOKSH' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--accent)' }} />}
                        
                        <div className="avatar avatar-lg avatar-gradient-1" style={{ margin: '0 auto 16px' }}>M</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Moksh</div>
                        
                        <div style={{ margin: '8px auto 16px', display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: '0.8125rem', fontWeight: 800, ...getRankBadgeStyle(mokshMonthScore) }}>
                            {getRank(mokshMonthScore)}
                        </div>

                        <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--accent)', lineHeight: 1 }}>{mokshMonthScore}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>Monthly Points</div>
                    </div>

                    {/* Smit Scorecard */}
                    <div className="card" style={{ padding: 32, textAlign: 'center', background: monthLeader === 'smit' ? 'linear-gradient(to bottom, #eff6ff, #ffffff)' : 'white', border: monthLeader === 'smit' ? '2px solid var(--info)' : '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                        {monthLeader === 'smit' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--info)' }} />}
                        
                        <div className="avatar avatar-lg avatar-gradient-2" style={{ margin: '0 auto 16px' }}>S</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Smit</div>
                        
                        <div style={{ margin: '8px auto 16px', display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: '0.8125rem', fontWeight: 800, ...getRankBadgeStyle(smitMonthScore) }}>
                            {getRank(smitMonthScore)}
                        </div>

                        <div style={{ fontSize: '4rem', fontWeight: 900, color: 'var(--info)', lineHeight: 1 }}>{smitMonthScore}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>Monthly Points</div>
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
