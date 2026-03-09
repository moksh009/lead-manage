"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CHANNELS = [
    { sentKey: 'dmsSent', label: 'Instagram DMs', icon: '📸', color: '#e1306c', bg: '#fff1f5', desc: 'Direct messages via Instagram' },
    { sentKey: 'emailsSent', label: 'Emails', icon: '📧', color: '#2563eb', bg: '#eff6ff', desc: 'Cold / warm emails sent' },
    { sentKey: 'whatsappSent', label: 'WhatsApp', icon: '💬', color: '#25D366', bg: '#f0fdf4', desc: 'WhatsApp outreach messages' },
    { sentKey: 'callsMade', label: 'Cold Calls', icon: '📞', color: '#7c3aed', bg: '#faf5ff', desc: 'Calls made to prospects' },
];

const EMPTY = { dmsSent: '', emailsSent: '', whatsappSent: '', callsMade: '' };

export default function OutreachPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [form, setForm] = useState(EMPTY);
    const [submitted, setSubmitted] = useState(false);

    const totalSent = CHANNELS.reduce((s, ch) => s + (Number(form[ch.sentKey as keyof typeof form]) || 0), 0);
    const setField = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload: any = { date, dmsReplies: 0, emailReplies: 0, whatsappReplies: 0, callReplies: 0, meetings: 0, clientsClosed: 0 };
            Object.keys(form).forEach(k => { payload[k] = Number(form[k as keyof typeof form]) || 0; });
            await fetch('/api/outreach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            setSubmitted(true);
            setTimeout(() => router.push('/'), 1200);
        } finally { setLoading(false); }
    };

    if (submitted) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>✅</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Log Submitted!</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Redirecting to dashboard…</p>
            </div>
        );
    }

    return (
        <div className="animate-in" style={{ maxWidth: 700, margin: '0 auto' }}>

            {/* Hero */}
            <div className="page-hero" style={{ marginBottom: 28 }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>📊</div>
                    <h1 className="page-hero-title">Daily Outreach Log</h1>
                    <p className="page-hero-sub">Record today's outreach — replies & meetings are auto-tracked from leads</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Date selector */}
                <div className="card card-p">
                    <label className="form-label" style={{ marginBottom: 8, display: 'block', fontSize: '0.8125rem', fontWeight: 700 }}>📅 Log Date</label>
                    <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} required />
                </div>

                {/* Channel cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-xs)' }}>
                    {/* Header */}
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                        <div>
                            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>📤 Outreach Sent Today</h2>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>Enter numbers per channel</p>
                        </div>
                        {totalSent > 0 && (
                            <div style={{ background: 'var(--accent)', color: 'white', padding: '4px 14px', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 700, boxShadow: 'var(--shadow-accent)' }}>
                                {totalSent.toLocaleString()} total
                            </div>
                        )}
                    </div>

                    {CHANNELS.map((ch, idx) => {
                        const val = Number(form[ch.sentKey as keyof typeof form]) || 0;
                        return (
                            <div key={ch.sentKey} style={{
                                display: 'grid', gridTemplateColumns: '1fr 160px',
                                padding: '16px 24px', borderBottom: idx < CHANNELS.length - 1 ? '1px solid var(--border)' : 'none',
                                alignItems: 'center', gap: 16,
                                background: val > 0 ? `${ch.bg}` : 'transparent',
                                transition: 'background 0.2s ease'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                    <div style={{
                                        width: 44, height: 44, borderRadius: 12,
                                        background: ch.bg, border: `1.5px solid ${ch.color}25`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
                                    }}>{ch.icon}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{ch.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{ch.desc}</div>
                                    </div>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number" min="0"
                                        className="form-input"
                                        style={{
                                            textAlign: 'center', fontWeight: 800, fontSize: '1.25rem',
                                            padding: '8px 12px', borderRadius: 12,
                                            color: val > 0 ? ch.color : 'var(--text-primary)',
                                            borderColor: val > 0 ? `${ch.color}40` : 'var(--border)',
                                            background: val > 0 ? '#ffffff' : 'var(--bg-secondary)'
                                        }}
                                        placeholder="0"
                                        value={form[ch.sentKey as keyof typeof form]}
                                        onChange={e => setField(ch.sentKey, e.target.value)}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Auto-tracking info */}
                <div style={{ padding: '14px 18px', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>🤖</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--success)', marginBottom: 4 }}>Auto-tracking is active</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            Replies, meetings & closed clients are tracked automatically from your Leads — no double entry needed.
                        </div>
                    </div>
                </div>

                {/* Submit row */}
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 4 }}>
                    <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ minWidth: 160 }}>
                        {loading ? '⏳ Saving...' : '✓ Submit Log'}
                    </button>
                </div>
            </form >
        </div >
    );
}
