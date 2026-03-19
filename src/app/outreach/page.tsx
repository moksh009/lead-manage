"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/UserContext';

const CHANNELS = [
    { sentKey: 'dmsSent', leadChannel: 'dm', label: 'Instagram DMs', icon: '📸', color: '#e1306c', bg: 'rgba(225, 48, 108, 0.1)', desc: 'Direct messages via Instagram' },
    { sentKey: 'emailsSent', leadChannel: 'email', label: 'Emails', icon: '📧', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)', desc: 'Cold / warm emails sent' },
    { sentKey: 'whatsappSent', leadChannel: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#25D366', bg: 'rgba(37, 211, 102, 0.1)', desc: 'WhatsApp outreach messages' },
    { sentKey: 'callsMade', leadChannel: 'call', label: 'Cold Calls', icon: '📞', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.1)', desc: 'Calls made to prospects' },
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function OutreachPage() {
    const router = useRouter();
    const { currentUser } = useUser();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Per-channel numbers (sent counts only — user enters these)
    const [form, setForm] = useState({ dmsSent: '', emailsSent: '', whatsappSent: '', callsMade: '' });

    // Existing record for the selected date (null = no entry yet for that date)
    const [existingRecord, setExistingRecord] = useState<any>(null);

    // Leads data for reply rate calculation
    const [leadsPerChannel, setLeadsPerChannel] = useState<Record<string, number>>({});

    // Historical logs
    const [allLogs, setAllLogs] = useState<any[]>([]);
    const [allLeads, setAllLeads] = useState<any[]>([]);

    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [isEditing, setIsEditing] = useState(false);

    // Load leads (for reply count per channel) and all logs once
    useEffect(() => {
        Promise.all([
            fetch('/api/leads').then(r => r.json()),
            fetch('/api/outreach').then(r => r.json()),
        ]).then(([leadsData, outreachData]) => {
            const leads: any[] = leadsData.data || [];
            setAllLeads(leads);

            // Count leads per channel (each lead = 1 reply)
            const counts: Record<string, number> = {};
            CHANNELS.forEach(ch => {
                counts[ch.leadChannel] = leads.filter(l => l.channel === ch.leadChannel).length;
            });
            setLeadsPerChannel(counts);

            setAllLogs((outreachData.records || []).sort((a: any, b: any) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            ));
        });
    }, []);

    // Whenever date changes, fetch that date's existing outreach record
    useEffect(() => {
        fetch(`/api/outreach?date=${date}`)
            .then(r => r.json())
            .then(data => {
                const rec = data.data;
                setExistingRecord(rec);
                if (rec) {
                    // Pre-fill form with existing values
                    setForm({
                        dmsSent: rec.dmsSent > 0 ? String(rec.dmsSent) : '',
                        emailsSent: rec.emailsSent > 0 ? String(rec.emailsSent) : '',
                        whatsappSent: rec.whatsappSent > 0 ? String(rec.whatsappSent) : '',
                        callsMade: rec.callsMade > 0 ? String(rec.callsMade) : '',
                    });
                    setIsEditing(false); // start in "view" mode for existing entry
                } else {
                    setForm({ dmsSent: '', emailsSent: '', whatsappSent: '', callsMade: '' });
                    setIsEditing(true); // new date → straight to entry mode
                }
            });
    }, [date]);

    const setField = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

    const totalSent = CHANNELS.reduce((s, ch) => s + (Number(form[ch.sentKey as keyof typeof form]) || 0), 0);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveStatus('saving');
        try {
            const payload: any = { date };
            CHANNELS.forEach(ch => { payload[ch.sentKey] = Number(form[ch.sentKey as keyof typeof form]) || 0; });

            if (existingRecord) {
                // PATCH = set exact values (overwrite)
                await fetch('/api/outreach', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'x-user': currentUser },
                    body: JSON.stringify(payload)
                });
            } else {
                // POST = create new
                await fetch('/api/outreach', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-user': currentUser },
                    body: JSON.stringify(payload)
                });
            }

            setSaveStatus('saved');
            setIsEditing(false);

            // Refresh allLogs
            const updated = await fetch('/api/outreach').then(r => r.json());
            setAllLogs((updated.records || []).sort((a: any, b: any) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            ));

            // Also update existing record reference
            const rec = await fetch(`/api/outreach?date=${date}`).then(r => r.json());
            setExistingRecord(rec.data);

            setTimeout(() => setSaveStatus('idle'), 2500);
        } catch {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    };

    // Per-channel stats for a specific date's log entry and given leads
    // Replies are counted as leads added on that same date per channel
    function leadsOnDate(dateStr: string, channel: string) {
        const d = new Date(dateStr).toDateString();
        return allLeads.filter(l => l.channel === channel && new Date(l.createdAt || 0).toDateString() === d).length;
    }

    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;

    return (
        <div className="animate-in" style={{ maxWidth: 720, margin: '0 auto' }}>

            {/* Dark glassmorphic hero */}
            <div className="premium-card" style={{ marginBottom: 24, padding: '28px 32px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 1 }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: '1.5rem', padding: '6px', background: 'rgba(168,85,247,0.1)', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.2)' }}>📊</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', padding: '3px 12px', borderRadius: 99, color: '#d8b4fe' }}>
                            Daily Tracking
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px 0', background: 'linear-gradient(to right, #ffffff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Daily Outreach Log</h1>
                    <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Track messages sent per channel — replies are auto-calculated from leads you add</p>
                </div>
            </div>

            {/* Date Picker */}
            <div className="card card-p" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <label className="form-label-premium" style={{ marginBottom: 0 }}>
                        📅 select date
                    </label>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {[
                            { label: 'Today', days: 0 },
                            { label: 'Yesterday', days: 1 },
                            { label: '2 Days Ago', days: 2 }
                        ].map(s => {
                            const d = new Date();
                            d.setDate(d.getDate() - s.days);
                            const dStr = d.toISOString().split('T')[0];
                            const isActive = date === dStr;
                            return (
                                <button
                                    key={s.label}
                                    type="button"
                                    onClick={() => setDate(dStr)}
                                    style={{
                                        padding: '4px 10px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        borderRadius: '8px',
                                        border: '1px solid',
                                        borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                                        background: isActive ? 'var(--accent-gradient)' : 'var(--bg-secondary)',
                                        color: isActive ? 'white' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {s.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="date"
                        className="form-input"
                        style={{ maxWidth: 200 }}
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />
                    {existingRecord && (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--success)', fontWeight: 700, background: 'var(--success-light)', padding: '4px 12px', borderRadius: 99 }}>
                            ✓ Log exists for this date
                        </span>
                    )}
                    {!existingRecord && (
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', background: 'var(--bg-secondary)', padding: '4px 12px', borderRadius: 99 }}>
                            No entry yet
                        </span>
                    )}
                </div>
            </div>

            {/* Channel Entry / Edit Form */}
            <form onSubmit={handleSave} style={{ marginBottom: 24 }}>
                <div style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', background: 'var(--surface)', boxShadow: 'var(--shadow-xs)' }}>
                    {/* Header */}
                    <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                        <div>
                            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>
                                {existingRecord && !isEditing ? '📋 Log Summary' : '📤 Enter Outreach Numbers'}
                            </h2>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                {existingRecord && !isEditing
                                    ? 'Click "Edit" to update any number'
                                    : 'Enter how many you sent per channel — add more later anytime'}
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {totalSent > 0 && (
                                <div style={{ background: 'var(--accent)', color: 'white', padding: '4px 14px', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 700, boxShadow: 'var(--shadow-accent)' }}>
                                    {totalSent.toLocaleString()} total
                                </div>
                            )}
                            {existingRecord && !isEditing && (
                                <button 
                                    type="button" 
                                    className="btn btn-premium btn-sm" 
                                    onClick={() => setIsEditing(true)}
                                    style={{ boxShadow: '0 4px 12px rgba(168,85,247,0.4)', border: 'none' }}
                                >
                                    ✏️ Edit Numbers
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Column headers */}
                    <div className="outreach-grid-header" style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 130px 130px 110px',
                        padding: '8px 24px',
                        background: 'var(--bg-tertiary)',
                        borderBottom: '1px solid var(--border)',
                        fontSize: '10px', fontWeight: 900, color: 'var(--text-tertiary)',
                        textTransform: 'lowercase', letterSpacing: '-0.01em'
                    }}>
                        <span>Channel</span>
                        <span style={{ textAlign: 'center' }}>Sent</span>
                        <span style={{ textAlign: 'center' }}>Replies (leads)</span>
                        <span style={{ textAlign: 'center' }}>Reply %</span>
                    </div>

                    {CHANNELS.map((ch, idx) => {
                        const sentVal = Number(form[ch.sentKey as keyof typeof form]) || 0;
                        const existingSent = existingRecord?.[ch.sentKey] || 0;
                        const displaySent = !isEditing && existingRecord ? existingSent : sentVal;

                        // Replies = leads from this channel (total all-time per channel)
                        const channelReplies = leadsPerChannel[ch.leadChannel] || 0;
                        const totalSentForChannel = allLogs.reduce((s: number, log: any) => s + (log[ch.sentKey] || 0), 0);
                        const replyRate = totalSentForChannel > 0
                            ? ((channelReplies / totalSentForChannel) * 100).toFixed(1)
                            : '—';

                        return (
                            <div
                                key={ch.sentKey}
                                className="outreach-row"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 130px 130px 110px',
                                    padding: '14px 24px',
                                    borderBottom: idx < CHANNELS.length - 1 ? '1px solid var(--border)' : 'none',
                                    alignItems: 'center',
                                    background: displaySent > 0 ? ch.bg : 'transparent',
                                    transition: 'background 0.2s ease'
                                }}
                            >
                                {/* Channel name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 11,
                                        background: 'white', border: `1.5px solid ${ch.color}25`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
                                        boxShadow: 'var(--shadow-xs)'
                                    }}>{ch.icon}</div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{ch.label}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 1 }}>{ch.desc}</div>
                                    </div>
                                </div>

                                {/* Sent input or display */}
                                <div style={{ textAlign: 'center' }}>
                                    {isEditing || !existingRecord ? (
                                        <input
                                            type="number"
                                            className="input-premium"
                                            value={form[ch.sentKey as keyof typeof form]}
                                            onChange={e => setField(ch.sentKey, e.target.value)}
                                            placeholder="0"
                                            style={{ width: '100px', textAlign: 'center', fontWeight: 800, fontSize: '1.25rem', color: 'white', padding: '8px' }}
                                        />
                                    ) : (
                                        <div style={{ fontWeight: 800, fontSize: '1.5rem', color: displaySent > 0 ? 'white' : 'rgba(255,255,255,0.2)' }}>
                                            {displaySent.toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                {/* Replies (leads count from this channel) */}
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontWeight: 800, fontSize: '1.125rem', color: channelReplies > 0 ? 'var(--success)' : 'var(--text-tertiary)' }}>
                                        {channelReplies}
                                    </span>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 1 }}>total leads</div>
                                </div>

                                {/* Reply rate */}
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{
                                        fontWeight: 800, fontSize: '1rem',
                                        color: replyRate === '—' || replyRate === '0.0'
                                            ? 'var(--text-tertiary)'
                                            : Number(replyRate) >= 5 ? 'var(--success)' : 'var(--warning)'
                                    }}>
                                        {replyRate === '—' ? '—' : `${replyRate}%`}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Save row */}
                {isEditing && (
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        {existingRecord && (
                            <button 
                                type="button" 
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', borderRadius: '12px', fontWeight: 600, cursor: 'pointer' }}
                                onClick={() => {
                                    setForm({
                                        dmsSent: existingRecord.dmsSent > 0 ? String(existingRecord.dmsSent) : '',
                                        emailsSent: existingRecord.emailsSent > 0 ? String(existingRecord.emailsSent) : '',
                                        whatsappSent: existingRecord.whatsappSent > 0 ? String(existingRecord.whatsappSent) : '',
                                        callsMade: existingRecord.callsMade > 0 ? String(existingRecord.callsMade) : '',
                                    });
                                    setIsEditing(false);
                                }}
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            className="btn btn-premium"
                            disabled={saveStatus === 'saving'}
                            style={{ minWidth: '180px', padding: '12px 24px', borderRadius: '12px', fontSize: '0.95rem' }}
                        >
                            {saveStatus === 'saving' ? '⏳ Saving...' :
                                saveStatus === 'saved' ? '✅ Saved!' :
                                    existingRecord ? '💾 Update Daily Log' : '✓ Save Daily Log'}
                        </button>
                    </div>
                )}
            </form>

            {/* Auto-tracking info */}
            <div style={{ padding: '14px 18px', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 12, marginBottom: 28, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>🤖</span>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--success)', marginBottom: 4 }}>Replies auto-calculated from Leads</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        Every lead you add counts as 1 reply for its channel. Reply rate = (leads from channel) ÷ (total sent to channel).
                        You can save partial numbers and edit them any time.
                    </div>
                </div>
            </div>

            {/* All Logs History */}
            {allLogs.length > 0 && (
                <div className="premium-card" style={{ marginBottom: 20 }}>

                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>📅 Log History</h2>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>Click any day to load and edit it</p>
                        </div>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            {allLogs.length} entries
                        </span>
                    </div>
                    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {allLogs.map((log: any) => {
                            const logDate = new Date(log.date).toISOString().split('T')[0];
                            const totalForDay = (log.dmsSent || 0) + (log.emailsSent || 0) + (log.whatsappSent || 0) + (log.callsMade || 0);
                            const isSelected = logDate === date;
                            const isLogToday = logDate === today;

                            return (
                                <button
                                    key={log._id}
                                    type="button"
                                    onClick={() => setDate(logDate)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        padding: '10px 14px', borderRadius: 10, border: '1px solid',
                                        borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                                        background: isSelected ? 'rgba(37,99,235,0.05)' : 'var(--bg-secondary)',
                                        cursor: 'pointer', textAlign: 'left', width: '100%',
                                        transition: 'all 0.15s ease',
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? 'var(--accent)' : 'var(--text-primary)' }}>
                                            {isLogToday ? 'Today' : new Date(log.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </div>
                                        <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                                            {CHANNELS.filter(ch => (log[ch.sentKey] || 0) > 0).map(ch => (
                                                <span key={ch.sentKey} style={{ fontSize: '0.7rem', color: ch.color, fontWeight: 600 }}>
                                                    {ch.icon} {log[ch.sentKey]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '1rem', fontWeight: 800,
                                        color: 'var(--text-primary)',
                                        minWidth: 50, textAlign: 'right'
                                    }}>
                                        {totalForDay.toLocaleString()}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', minWidth: 20 }}>→</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {allLogs.length === 0 && (
                <div className="card card-p">
                    <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <div className="empty-title">No logs yet</div>
                        <div className="empty-desc">Enter your first outreach numbers above</div>
                    </div>
                </div>
            )}
        </div>
    );
}
