"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CHANNELS = [
    { sentKey: 'dmsSent', label: 'Instagram DMs', icon: '📸', color: '#E1306C' },
    { sentKey: 'emailsSent', label: 'Emails', icon: '📧', color: '#0071e3' },
    { sentKey: 'whatsappSent', label: 'WhatsApp', icon: '💬', color: '#25D366' },
    { sentKey: 'callsMade', label: 'Cold Calls', icon: '📞', color: '#5856d6' },
];

const EMPTY = { dmsSent: '', emailsSent: '', whatsappSent: '', callsMade: '' };

export default function OutreachPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [form, setForm] = useState(EMPTY);

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
            router.push('/');
        } finally { setLoading(false); }
    };

    return (
        <div className="animate-in" style={{ maxWidth: 680, margin: '0 auto' }}>
            <div style={{ marginBottom: 28 }}>
                <h1 className="page-title">Add Daily Log</h1>
                <p className="page-subtitle">Enter how many outreach you sent today — replies, meetings and closed clients are tracked automatically from your leads</p>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Date */}
                <div className="card card-p" style={{ marginBottom: 16 }}>
                    <div className="form-group">
                        <label className="form-label">📅 Date</label>
                        <input type="date" className="form-input" value={date} onChange={e => setDate(e.target.value)} required />
                    </div>
                </div>

                {/* Sent counts per channel */}
                <div className="card" style={{ marginBottom: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>📤 Outreach Sent</h2>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>How many messages/calls did you send today?</p>
                        </div>
                        {totalSent > 0 && (
                            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '4px 12px', borderRadius: 99 }}>
                                {totalSent.toLocaleString()} total
                            </span>
                        )}
                    </div>

                    {/* Header row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 0, padding: '10px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Channel</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'center' }}>Sent</div>
                    </div>

                    {CHANNELS.map((ch, idx) => (
                        <div key={ch.sentKey} style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 0, padding: '12px 24px', borderBottom: idx < CHANNELS.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, background: `${ch.color}15`, border: `1px solid ${ch.color}25` }}>{ch.icon}</div>
                                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{ch.label}</span>
                            </div>
                            <div>
                                <input
                                    type="number" min="0"
                                    className="form-input"
                                    style={{ textAlign: 'center', fontWeight: 700, fontSize: '1.1rem', padding: '8px' }}
                                    placeholder="0"
                                    value={form[ch.sentKey as keyof typeof form]}
                                    onChange={e => setField(ch.sentKey, e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Info box about auto-tracking */}
                <div style={{ padding: '14px 18px', background: 'rgba(48,209,88,0.08)', border: '1px solid rgba(48,209,88,0.25)', borderRadius: 12, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>🤖</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--success)', marginBottom: 4 }}>Replies, meetings & closed are auto-tracked</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            When you add a lead in <strong>Cold Calling Leads</strong>, it auto-counts as a reply for the matching channel.<br />
                            Mark a lead as <strong>Meeting Set</strong> → auto-increments meetings. Mark as <strong>Client 🎉</strong> → auto-counts as closed.
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? '⏳ Saving...' : '✓ Submit Log'}
                    </button>
                </div>
            </form>
        </div>
    );
}
