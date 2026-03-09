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
        legend: { labels: { color: '#6e6e73', usePointStyle: true, font: { size: 12, family: '-apple-system' } } },
        tooltip: {
            backgroundColor: 'rgba(255,255,255,0.98)',
            titleColor: '#1d1d1f', bodyColor: '#6e6e73',
            borderColor: 'rgba(0,0,0,0.08)', borderWidth: 1, padding: 12, cornerRadius: 10,
        }
    }
};

const scaleStyle = {
    x: { ticks: { color: '#a1a1a6' }, grid: { color: 'rgba(0,0,0,0.04)' } },
    y: { ticks: { color: '#a1a1a6' }, grid: { color: 'rgba(0,0,0,0.04)' } }
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
            {
                label: 'DMs',
                data: sorted.map(r => r.dmsSent),
                borderColor: '#0071e3',
                backgroundColor: 'rgba(0,113,227,0.08)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: 'Emails',
                data: sorted.map(r => r.emailsSent),
                borderColor: '#30d158',
                backgroundColor: 'rgba(48,209,88,0.06)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: 'WhatsApp',
                data: sorted.map(r => r.whatsappSent),
                borderColor: '#ff9500',
                backgroundColor: 'rgba(255,149,0,0.06)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: 'Calls',
                data: sorted.map(r => r.callsMade),
                borderColor: '#5856d6',
                backgroundColor: 'rgba(88,86,214,0.06)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ]
    };

    const repliesData = {
        labels,
        datasets: [
            {
                label: 'Replies',
                data: sorted.map(r => r.replies),
                backgroundColor: 'rgba(0,113,227,0.85)',
                borderRadius: 6,
            },
            {
                label: 'Meetings',
                data: sorted.map(r => r.meetings),
                backgroundColor: 'rgba(88,86,214,0.85)',
                borderRadius: 6,
            },
        ]
    };

    const leadTypeData = {
        labels: ['Hot lead', 'Qualified', 'Soft lead', 'Unqualified Lead'],
        datasets: [{
            data: [
                leads.filter(l => l.leadType === 'Hot lead').length,
                leads.filter(l => l.leadType === 'Qualified').length,
                leads.filter(l => l.leadType === 'Soft lead').length,
                leads.filter(l => l.leadType === 'Unqualified Lead').length,
            ],
            backgroundColor: ['#ff3b30', '#30d158', '#0071e3', '#ff9500'],
            borderColor: '#ffffff',
            borderWidth: 3,
            hoverOffset: 8,
        }]
    };

    // Calculate cumulative totals
    let cumTotal = 0;
    const cumData = sorted.map(r => {
        cumTotal += r.dmsSent + r.emailsSent + r.whatsappSent + r.callsMade;
        return cumTotal;
    });

    const cumulativeData = {
        labels,
        datasets: [{
            label: 'Cumulative Outreach',
            data: cumData,
            borderColor: '#0071e3',
            backgroundColor: 'rgba(0,113,227,0.1)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointRadius: 3,
        }]
    };

    const totalSent = records.reduce((s, r) => s + r.dmsSent + r.emailsSent + r.whatsappSent + r.callsMade, 0);
    const totalReplies = records.reduce((s, r) => s + (r.replies || 0), 0);
    const totalMeetings = records.reduce((s, r) => s + (r.meetings || 0), 0);
    const totalClosed = records.reduce((s, r) => s + (r.clientsClosed || 0), 0);
    const avgPerDay = records.length > 0 ? Math.round(totalSent / records.length) : 0;

    if (loading) {
        return <div className="animate-in"><div className="page-header"><div><div className="skeleton" style={{ height: 36, width: 250, marginBottom: 8 }} /><div className="skeleton" style={{ height: 20, width: 180 }} /></div></div><div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>{[1, 2, 3].map(i => <div key={i} className="card" style={{ height: 300 }} />)}</div></div>;
    }

    return (
        <div className="animate-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics</h1>
                    <p className="page-subtitle">Deep dive into your outreach performance across all channels</p>
                </div>
            </div>

            {/* KPI row */}
            <div className="stats-grid stagger-children" style={{ marginBottom: 28 }}>
                {[
                    { label: 'Total Outreach', value: totalSent, icon: '📤', color: 'accent' },
                    { label: 'Total Replies', value: totalReplies, icon: '💬', color: 'success' },
                    { label: 'Meetings Set', value: totalMeetings, icon: '📅', color: 'warning' },
                    { label: 'Clients Closed', value: totalClosed, icon: '🤝', color: 'purple' },
                    { label: 'Avg/Day', value: avgPerDay, icon: '📊', color: 'info' },
                    { label: 'Total Leads', value: leads.length, icon: '🎯', color: 'accent' },
                ].map(s => (
                    <div key={s.label} className={`stat-card ${s.color}`}>
                        <div className={`stat-icon ${s.color}`}>{s.icon}</div>
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-value" style={{ fontSize: '1.75rem' }}>{s.value.toLocaleString()}</div>
                    </div>
                ))}
            </div>

            {records.length === 0 ? (
                <div className="card card-p">
                    <div className="empty-state">
                        <div className="empty-icon">📊</div>
                        <div className="empty-title">No outreach data yet</div>
                        <div className="empty-desc">Start submitting daily logs to see analytics charts here</div>
                        <a href="/outreach"><button className="btn btn-primary" style={{ marginTop: 16 }}>Add First Log</button></a>
                    </div>
                </div>
            ) : (
                <>
                    {/* Channel Trend */}
                    <div className="card card-p" style={{ marginBottom: 20 }}>
                        <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 20 }}>Channel Activity Over Time</h2>
                        <div style={{ height: 280 }}>
                            <Line data={lineData} options={{ ...baseChartOpts, scales: scaleStyle } as any} />
                        </div>
                    </div>

                    <div className="grid-2" style={{ marginBottom: 20 }}>
                        {/* Replies & Meetings */}
                        <div className="card card-p">
                            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 20 }}>Replies & Meetings per Day</h2>
                            <div style={{ height: 240 }}>
                                <Bar data={repliesData} options={{ ...baseChartOpts, scales: scaleStyle } as any} />
                            </div>
                        </div>

                        {/* Lead Types */}
                        <div className="card card-p">
                            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 20 }}>Lead Quality Breakdown</h2>
                            <div style={{ height: 180 }}>
                                <Doughnut data={leadTypeData} options={{ ...baseChartOpts, plugins: { ...baseChartOpts.plugins, legend: { ...baseChartOpts.plugins.legend, position: 'bottom' as const } } }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
                                {[
                                    { label: 'Hot lead 🔥', count: leads.filter(l => l.leadType === 'Hot lead').length, color: '#ff3b30' },
                                    { label: 'Qualified', count: leads.filter(l => l.leadType === 'Qualified').length, color: '#30d158' },
                                    { label: 'Soft lead', count: leads.filter(l => l.leadType === 'Soft lead').length, color: '#0071e3' },
                                    { label: 'Unqualified', count: leads.filter(l => l.leadType === 'Unqualified Lead').length, color: '#ff9500' },
                                ].map(s => (
                                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', flex: 1 }}>{s.label}</span>
                                        <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{s.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Cumulative Growth */}
                    <div className="card card-p" style={{ marginBottom: 20 }}>
                        <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: 20 }}>Cumulative Outreach Growth</h2>
                        <div style={{ height: 220 }}>
                            <Line data={cumulativeData} options={{ ...baseChartOpts, scales: scaleStyle } as any} />
                        </div>
                    </div>

                    {/* Funnel Conversion Table */}
                    <div className="card" style={{ marginBottom: 20 }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>Conversion Funnel Rates</h2>
                        </div>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Stage</th>
                                    <th>Count</th>
                                    <th>Rate from Previous</th>
                                    <th>Visual</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { label: 'Sent', count: totalSent, prevCount: null },
                                    { label: 'Replies', count: totalReplies, prevCount: totalSent },
                                    { label: 'Meetings', count: totalMeetings, prevCount: totalReplies },
                                    { label: 'Closed', count: totalClosed, prevCount: totalMeetings },
                                ].map(row => {
                                    const rate = row.prevCount && row.prevCount > 0 ? (row.count / row.prevCount * 100).toFixed(1) : null;
                                    const pct = totalSent > 0 ? (row.count / totalSent * 100) : 0;
                                    return (
                                        <tr key={row.label}>
                                            <td style={{ fontWeight: 700 }}>{row.label}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{row.count.toLocaleString()}</td>
                                            <td style={{ color: rate ? (Number(rate) >= 5 ? 'var(--success)' : 'var(--text-secondary)') : 'var(--text-tertiary)' }}>
                                                {rate ? `${rate}%` : '—'}
                                            </td>
                                            <td style={{ minWidth: 120 }}>
                                                <div style={{ background: 'var(--bg-secondary)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                                                    <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: 'var(--accent)', transition: 'width 1s ease' }} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
