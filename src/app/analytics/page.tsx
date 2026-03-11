"use client";

import { useEffect, useState } from 'react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement,
    PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler, ArcElement);

const baseChartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#6b7280', usePointStyle: true, font: { size: 12, family: 'inherit' } } },
        tooltip: {
            backgroundColor: 'rgba(255,255,255,0.98)',
            titleColor: '#111110', bodyColor: '#6b7280',
            borderColor: 'rgba(0,0,0,0.08)', borderWidth: 1, padding: 14, cornerRadius: 12,
        }
    }
};

const scaleStyle = {
    x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(0,0,0,0.04)' } },
    y: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(0,0,0,0.04)' } }
};

export default function AnalyticsPage() {
    const [records, setRecords] = useState<any[]>([]);
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/outreach').then(r => r.json()),
            fetch('/api/leads').then(r => r.json()),
        ]).then(([outreachData, leadsData]) => {
            setRecords(outreachData.records || []);
            setLeads(leadsData.data || []);
            setLoading(false);
        });
    }, []);

    const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const labels = sorted.map(r => new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }));

    const lineData = {
        labels,
        datasets: [
            { label: 'DMs', data: sorted.map(r => r.dmsSent), borderColor: '#e1306c', backgroundColor: 'rgba(225,48,108,0.08)', borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7 },
            { label: 'Emails', data: sorted.map(r => r.emailsSent), borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.07)', borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7 },
            { label: 'WhatsApp', data: sorted.map(r => r.whatsappSent), borderColor: '#25D366', backgroundColor: 'rgba(37,211,102,0.07)', borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7 },
            { label: 'Calls', data: sorted.map(r => r.callsMade), borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.07)', borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 7 },
        ]
    };

    const repliesData = {
        labels,
        datasets: [
            { label: 'Replies', data: sorted.map(r => r.replies), backgroundColor: 'rgba(37,99,235,0.8)', borderRadius: 7 },
            { label: 'Meetings', data: sorted.map(r => r.meetings), backgroundColor: 'rgba(124,58,237,0.8)', borderRadius: 7 },
        ]
    };

    const leadTypeData = {
        labels: ['Hot lead 🔥', 'Qualified ✅', 'Soft lead', 'Unqualified'],
        datasets: [{
            data: [
                leads.filter(l => l.leadType === 'Hot lead').length,
                leads.filter(l => l.leadType === 'Qualified').length,
                leads.filter(l => l.leadType === 'Soft lead').length,
                leads.filter(l => l.leadType === 'Unqualified Lead').length,
            ],
            backgroundColor: ['#dc2626', '#16a34a', '#2563eb', '#d97706'],
            borderColor: '#ffffff', borderWidth: 3, hoverOffset: 8,
        }]
    };

    let cumTotal = 0;
    const cumData = sorted.map(r => { cumTotal += r.dmsSent + r.emailsSent + r.whatsappSent + r.callsMade; return cumTotal; });

    const cumulativeData = {
        labels,
        datasets: [{
            label: 'Cumulative Outreach',
            data: cumData,
            borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.1)',
            borderWidth: 2.5, fill: true, tension: 0.4, pointRadius: 3,
        }]
    };

    const totalSent = records.reduce((s, r) => s + r.dmsSent + r.emailsSent + r.whatsappSent + r.callsMade, 0);
    const avgPerDay = records.length > 0 ? Math.round(totalSent / records.length) : 0;

    // Lead-derived metrics (real data from pipeline stages)
    function getStage(lead: any) {
        if (lead.pipelineStage) return lead.pipelineStage.toLowerCase();
        if (lead.leadType === 'Unqualified Lead') return 'not interested';
        if (lead.leadType === 'Soft lead') return 'follow-up scheduled';
        if (lead.leadType === 'Qualified') return 'upcoming call';
        if (lead.leadType === 'Hot lead') return 'interested';
        return 'contacted';
    }

    const MEETING_STAGES = ['meeting booked', 'meeting booked not convert', 'meeting', 'no show up'];
    const CLOSED_STAGES = ['closed won', 'closed', 'client'];

    const totalLeads = leads.length;
    const meetingLeads = leads.filter(l => MEETING_STAGES.some(s => getStage(l).includes(s))).length;
    const closedLeads = leads.filter(l => CLOSED_STAGES.some(s => getStage(l).includes(s))).length;
    const ghostedLeads = leads.filter(l => getStage(l) === 'ghosted').length;
    const notConvertedMeetingLeads = leads.filter(l => getStage(l) === 'meeting booked not convert').length;

    const meetingRate = totalLeads > 0 ? (meetingLeads / totalLeads * 100).toFixed(1) : '0.0';
    const closeRate = totalLeads > 0 ? (closedLeads / totalLeads * 100).toFixed(1) : '0.0';
    const meetToClose = meetingLeads > 0 ? (closedLeads / meetingLeads * 100).toFixed(1) : '0.0';

    // Channel breakdown from leads (Replies)
    const byChannel = {
        dms: leads.filter(l => l.channel === 'instagram_dm' || l.channel === 'instagram' || l.channel === 'dm').length,
        emails: leads.filter(l => l.channel === 'email').length,
        whatsapp: leads.filter(l => l.channel === 'whatsapp').length,
        calls: leads.filter(l => l.channel === 'cold_call' || l.channel === 'call').length,
    };

    // Channel breakdown from outreach logs (Sent)
    const sentByChannel = {
        dms: records.reduce((s, r) => s + (r.dmsSent || 0), 0),
        emails: records.reduce((s, r) => s + (r.emailsSent || 0), 0),
        whatsapp: records.reduce((s, r) => s + (r.whatsappSent || 0), 0),
        calls: records.reduce((s, r) => s + (r.callsMade || 0), 0),
    };

    if (loading) {
        return (
            <div className="animate-in">
                <div className="skeleton" style={{ height: 140, borderRadius: 16, marginBottom: 20 }} />
                <div className="stats-grid">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="stat-card skeleton" style={{ height: 110 }} />)}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in">
            {/* Hero */}
            <div className="page-hero" style={{ marginBottom: 32, background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: '1.25rem', padding: '6px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>📈</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)' }}>
                            Performance Insights
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: 0 }}>Analytics</h1>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>Deep-dive into your outreach performance across all channels</p>
                </div>
            </div>

            {/* KPI strip */}
            <div className="stats-grid stagger-children" style={{ marginBottom: 32 }}>
                {[
                    { label: 'Total Leads', value: totalLeads, icon: '🎯', color: 'var(--text-primary)' },
                    { label: 'Meetings Booked', value: meetingLeads, icon: '📅', color: 'var(--success)' },
                    { label: 'Closed Won', value: closedLeads, icon: '🤝', color: 'var(--accent)' },
                    { label: 'Ghosted', value: ghostedLeads, icon: '👻', color: 'var(--text-tertiary)' },
                    { label: 'Not Converted', value: notConvertedMeetingLeads, icon: '🚫', color: 'var(--danger)' },
                    { label: 'Total Sent', value: totalSent, icon: '📤', color: 'var(--text-primary)' },
                ].map(s => (
                    <div key={s.label} className="card card-hover" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, cursor: 'default', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                {s.icon}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>{s.label}</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value.toLocaleString()}</div>
                        </div>
                    </div>
                ))}
            </div>

            {records.length === 0 ? (
                <div className="card card-p">
                    <div className="empty-state">
                        <div className="empty-icon">📊</div>
                        <div className="empty-title">No outreach data yet</div>
                        <div className="empty-desc">Start submitting daily logs to see analytics charts</div>
                        <a href="/outreach"><button className="btn btn-primary" style={{ marginTop: 16 }}>Add First Log</button></a>
                    </div>
                </div>
            ) : (
                <>
                    {/* Conversion rate highlights */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                        {[
                            { label: 'Meeting Rate', val: `${meetingRate}%`, sub: `${meetingLeads} meetings from ${totalLeads} leads`, color: 'var(--success)' },
                            { label: 'Meeting → Close', val: meetingLeads > 0 ? `${meetToClose}%` : '—', sub: `${closedLeads} closed from ${meetingLeads} meetings`, color: 'var(--accent)' },
                            { label: 'Close Rate', val: `${closeRate}%`, sub: `${closedLeads} won from ${totalLeads} leads`, color: 'var(--text-primary)' },
                        ].map(r => (
                            <div key={r.label} className="card card-hover" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', textAlign: 'center', borderRadius: 'var(--radius-2xl)' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: r.color, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 12 }}>{r.val}</div>
                                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 4 }}>{r.label}</div>
                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{r.sub}</div>
                            </div>
                        ))}
                    </div>

                    {/* Channel Breakdown */}
                    <div className="card" style={{ marginBottom: 24, padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)' }}>
                        <div style={{ marginBottom: 24 }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>Channel Breakdown</h2>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4 }}>Sent vs Replies per channel</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {[
                                { label: 'Instagram DMs', sent: sentByChannel.dms, replies: byChannel.dms, color: '#e1306c' },
                                { label: 'Emails', sent: sentByChannel.emails, replies: byChannel.emails, color: '#2563eb' },
                                { label: 'WhatsApp', sent: sentByChannel.whatsapp, replies: byChannel.whatsapp, color: '#25D366' },
                                { label: 'Cold Calls', sent: sentByChannel.calls, replies: byChannel.calls, color: '#7c3aed' },
                            ].map(ch => {
                                const rate = ch.sent > 0 ? ((ch.replies / ch.sent) * 100).toFixed(1) : '0.0';
                                return (
                                    <div key={ch.label} style={{ padding: '16px 20px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', transition: 'transform var(--t-fast)' }} className="card-hover">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: ch.color }} />
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{ch.label}</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase' }}>Sent</div>
                                                <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--text-primary)' }}>{ch.sent.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase' }}>Replies</div>
                                                <div style={{ fontWeight: 800, fontSize: '1.125rem', color: 'var(--success)' }}>{ch.replies.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 800, textTransform: 'uppercase' }}>Rate</div>
                                                <div style={{ fontWeight: 800, fontSize: '1.125rem', color: rate !== '0.0' ? 'var(--accent)' : 'var(--text-tertiary)' }}>{rate}%</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Channel Trend */}
                    <div className="card" style={{ marginBottom: 24, padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Channel Activity Over Time</h2>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 24 }}>Daily outreach volume per channel</p>
                        <div style={{ height: 300 }}>
                            <Line data={lineData} options={{ ...baseChartOpts, scales: scaleStyle } as any} />
                        </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: 24 }}>
                        {/* Replies & Meetings bar */}
                        <div className="card" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Replies & Meetings</h2>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 24 }}>Per day performance</p>
                            <div style={{ height: 260 }}>
                                <Bar data={repliesData} options={{ ...baseChartOpts, scales: scaleStyle } as any} />
                            </div>
                        </div>

                        {/* Lead Quality donut */}
                        <div className="card" style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Lead Quality</h2>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Breakdown by lead type</p>
                            <div style={{ height: 200 }}>
                                <Doughnut data={leadTypeData} options={{ ...baseChartOpts, plugins: { ...baseChartOpts.plugins, legend: { ...baseChartOpts.plugins.legend, position: 'bottom' as const } } }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 24 }}>
                                {[
                                    { label: 'Hot lead 🔥', count: leads.filter(l => l.leadType === 'Hot lead').length, color: '#dc2626' },
                                    { label: 'Qualified', count: leads.filter(l => l.leadType === 'Qualified').length, color: '#16a34a' },
                                    { label: 'Soft lead', count: leads.filter(l => l.leadType === 'Soft lead').length, color: '#2563eb' },
                                    { label: 'Unqualified', count: leads.filter(l => l.leadType === 'Unqualified Lead').length, color: '#d97706' },
                                ].map(s => (
                                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', flex: 1, fontWeight: 600 }}>{s.label}</span>
                                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: s.color }}>{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Cumulative Growth */}
                    <div className="card" style={{ marginBottom: 24, padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>Cumulative Outreach Growth</h2>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 24 }}>Total messages sent since day one</p>
                        <div style={{ height: 240 }}>
                            <Line data={cumulativeData} options={{ ...baseChartOpts, scales: scaleStyle } as any} />
                        </div>
                    </div>

                    {/* Conversion Funnel Table */}
                    <div className="card" style={{ marginBottom: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-2xl)', overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)' }}>Conversion Funnel</h2>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4 }}>Step-by-step conversion rates</p>
                        </div>
                        <div className="table-wrap">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Stage</th>
                                        <th>Count</th>
                                        <th>Conversion</th>
                                        <th>Visual</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { label: '🎯 Total Leads', count: totalLeads, prevCount: null, color: '#db2777' },
                                        { label: '📅 Meetings', count: meetingLeads, prevCount: totalLeads, color: '#10b981' },
                                        { label: '🤝 Closed Won', count: closedLeads, prevCount: meetingLeads, color: '#16a34a' },
                                        { label: '👻 Ghosted', count: ghostedLeads, prevCount: totalLeads, color: '#6b7280' },
                                        { label: '🚫 Not Converted', count: notConvertedMeetingLeads, prevCount: totalLeads, color: '#dc2626' },
                                    ].map(row => {
                                        const rate = row.prevCount && row.prevCount > 0 ? (row.count / row.prevCount * 100).toFixed(1) : null;
                                        const pct = totalSent > 0 ? (row.count / totalSent * 100) : 0;
                                        return (
                                            <tr key={row.label}>
                                                <td style={{ fontWeight: 700 }}>{row.label}</td>
                                                <td style={{ fontWeight: 800, color: row.color, fontSize: '1.0625rem' }}>{row.count.toLocaleString()}</td>
                                                <td style={{ color: rate ? (Number(rate) >= 5 ? 'var(--success)' : 'var(--text-secondary)') : 'var(--text-tertiary)', fontWeight: 600 }}>
                                                    {rate ? `${rate}%` : '—'}
                                                </td>
                                                <td style={{ minWidth: 130 }}>
                                                    <div style={{ background: 'var(--bg-secondary)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: row.color, transition: 'width 1s ease' }} />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
