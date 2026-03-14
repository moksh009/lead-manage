"use client";

import { useEffect, useState } from 'react';

const STAGES = [
    { id: 'contacted', label: 'Contacted', color: '#2563eb', emoji: '🔵' },
    { id: 'waiting for resp.', label: 'Waiting for Resp.', color: '#a2845e', emoji: '🟤' },
    { id: 'follow-up scheduled', label: 'Follow-up Scheduled', color: '#af52de', emoji: '🟣' },
    { id: 'interested', label: 'Interested', color: '#d4af37', emoji: '🟡' },
    { id: 'meeting booked', label: 'Meeting Booked', color: '#10b981', emoji: '📅' },
    { id: 'ghosted', label: 'Ghosted', color: '#6b7280', emoji: '👻' },
    { id: 'meeting booked not convert', label: 'Meeting Not Convert', color: '#f97316', emoji: '⚠️' },
    { id: 'not interested', label: 'Not Interested', color: '#dc2626', emoji: '🔴' },
    { id: 'no show up', label: 'No Show Up', color: '#ff3b30', emoji: '🚫' },
    { id: 'new', label: 'New', color: '#6e6e73', emoji: '🆕' },
    { id: 'followup', label: 'Follow-up', color: '#ff9500', emoji: '🔄' },
    { id: 'proposal', label: 'Proposal Sent', color: '#ff2d55', emoji: '📋' },
    { id: 'closed', label: 'Client 🎉', color: '#16a34a', emoji: '🤝' },
];

const CHANNELS: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    'dm': { label: 'Instagram DM', icon: '📸', color: '#E1306C', bg: 'rgba(225,48,108,0.15)' },
    'email': { label: 'Email', icon: '📧', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
    'whatsapp': { label: 'WhatsApp', icon: '💬', color: '#25D366', bg: 'rgba(37,211,102,0.15)' },
    'call': { label: 'Cold Call', icon: '📞', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'Hot lead': { bg: 'rgba(220,38,38,0.12)', text: '#f87171', border: 'rgba(220,38,38,0.25)' },
    'Qualified': { bg: 'rgba(16,185,129,0.12)', text: '#34d399', border: 'rgba(16,185,129,0.25)' },
    'Soft lead': { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
    'Unqualified Lead': { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af', border: 'rgba(107,114,128,0.25)' },
};

function getStage(lead: any) {
    if (lead.pipelineStage) return lead.pipelineStage;
    if (lead.leadType === 'Unqualified Lead') return 'not interested';
    if (lead.leadType === 'Soft lead') return 'follow-up scheduled';
    if (lead.leadType === 'Qualified') return 'meeting booked';
    if (lead.leadType === 'Hot lead') return 'interested';
    return 'new';
}

export default function PipelinePage() {
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dragging, setDragging] = useState<string | null>(null);
    const [hoveredCol, setHoveredCol] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/leads').then(r => r.json()).then(j => {
            if (j.success) setLeads(j.data);
            setLoading(false);
        });
    }, []);

    const groupedLeads = STAGES.reduce((acc, stage) => {
        acc[stage.id] = leads.filter(l => getStage(l) === stage.id);
        return acc;
    }, {} as Record<string, any[]>);

    const handleMoveStage = async (leadId: string, newStage: string) => {
        setLeads(prev => prev.map(l => l._id === leadId ? { ...l, pipelineStage: newStage } : l));
        await fetch(`/api/leads/${leadId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pipelineStage: newStage })
        });
    };

    const totalValue = leads.filter(l => getStage(l) === 'closed').length;

    return (
        <div className="animate-in">
            {/* Dark glassmorphic hero */}
            <div className="card" style={{ padding: '32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: '1.5rem', padding: '6px', background: 'rgba(168,85,247,0.1)', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.2)' }}>🔄</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', padding: '3px 12px', borderRadius: 99, color: '#d8b4fe' }}>
                            {leads.length} Leads Tracked
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px 0', background: 'linear-gradient(to right, #ffffff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pipeline Board</h1>
                    <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 20px 0' }}>{totalValue} closed · Drag cards to update stage</p>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <a href="/leads"><button className="btn" style={{ background: 'var(--accent-gradient)', color: 'white', border: 'none', boxShadow: '0 4px 16px rgba(168,85,247,0.35)', fontWeight: 700 }}>+ Add Lead</button></a>
                    </div>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="card" style={{ marginBottom: 24, padding: '20px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                    {STAGES.filter(s => s.id !== 'new' && s.id !== 'followup' && s.id !== 'meeting' && s.id !== 'proposal' && s.id !== 'closed').map((stage) => {
                        const count = groupedLeads[stage.id]?.length || 0;
                        const pct = leads.length > 0 ? (count / leads.length * 100) : 0;
                        return (
                            <div key={stage.id} style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.85rem' }}>{stage.emoji}</span>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stage.label}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                                    <div style={{ fontWeight: 800, fontSize: '1.5rem', lineHeight: 1, color: stage.color }}>{count}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600, paddingBottom: 1 }}>{pct.toFixed(0)}%</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', marginTop: 20, borderRadius: 99, overflow: 'hidden', height: 5, background: 'rgba(255,255,255,0.05)' }}>
                    {STAGES.map(stage => {
                        const count = groupedLeads[stage.id]?.length || 0;
                        const pct = leads.length > 0 ? (count / leads.length * 100) : 0;
                        return pct > 0 ? <div key={stage.id} style={{ width: `${pct}%`, background: stage.color, transition: 'width 0.5s cubic-bezier(0.25, 1, 0.5, 1)' }} title={`${stage.label}: ${count}`} /> : null;
                    })}
                    {leads.length === 0 && <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)' }} />}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
                    {STAGES.slice(0, 5).map(s => (
                        <div key={s.id} style={{ flex: '0 0 260px', background: 'rgba(255,255,255,0.03)', borderRadius: 16, height: 200, border: '1px solid rgba(255,255,255,0.06)' }} className="skeleton" />
                    ))}
                </div>
            ) : (
                <div className="kanban-board" style={{ overflowX: 'auto', paddingBottom: 16 }}>
                    {STAGES.map(stage => (
                        <div
                            key={stage.id}
                            className="kanban-col"
                            style={{
                                background: 'rgba(255,255,255,0.02)',
                                border: hoveredCol === stage.id ? `1px solid ${stage.color}80` : '1px solid rgba(255,255,255,0.06)',
                                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                boxShadow: hoveredCol === stage.id ? `0 0 20px -5px ${stage.color}30` : 'none',
                                borderRadius: 'var(--radius-xl)',
                            }}
                            onDragOver={e => { e.preventDefault(); setHoveredCol(stage.id); }}
                            onDragLeave={() => setHoveredCol(null)}
                            onDrop={async e => {
                                e.preventDefault();
                                if (dragging) await handleMoveStage(dragging, stage.id);
                                setDragging(null);
                                setHoveredCol(null);
                            }}
                        >
                            <div className="kanban-col-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, boxShadow: `0 0 6px ${stage.color}80` }} />
                                    <span className="kanban-col-title">{stage.label}</span>
                                </div>
                                <span className="kanban-col-count" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}>{groupedLeads[stage.id]?.length || 0}</span>
                            </div>

                            <div className="kanban-cards">
                                {!groupedLeads[stage.id]?.length ? (
                                    <div style={{ padding: '24px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.15)', fontSize: '0.8rem', fontWeight: 600, border: '1.5px dashed rgba(255,255,255,0.07)', borderRadius: 12, background: 'transparent' }}>
                                        Drop leads here
                                    </div>
                                ) : (
                                    groupedLeads[stage.id].map(lead => (
                                        <div
                                            key={lead._id}
                                            draggable
                                            onDragStart={() => setDragging(lead._id)}
                                            onDragEnd={() => setDragging(null)}
                                            className="card card-hover"
                                            style={{
                                                opacity: dragging === lead._id ? 0.4 : 1,
                                                padding: '16px',
                                                cursor: 'grab',
                                                marginBottom: 12,
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                                borderRadius: 20,
                                                willChange: dragging === lead._id ? 'auto' : 'transform',
                                            }}
                                        >
                                            {/* Header: Company + Channel */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'white', lineHeight: 1.2, letterSpacing: '-0.02em', flex: 1, marginRight: 8 }}>
                                                    {lead.companyName}
                                                </div>
                                                {lead.channel && CHANNELS[lead.channel] && (
                                                    <div style={{
                                                        width: 28, height: 28, borderRadius: 8,
                                                        background: CHANNELS[lead.channel].bg,
                                                        border: `1px solid ${CHANNELS[lead.channel].color}30`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.9rem', flexShrink: 0
                                                    }} title={CHANNELS[lead.channel].label}>
                                                        {CHANNELS[lead.channel].icon}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Prospect Info + Type Tag */}
                                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    <div className="avatar avatar-sm avatar-gradient-1" style={{ width: 18, height: 18, fontSize: '0.55rem', fontWeight: 800 }}>
                                                        {lead.prospectName?.[0] || '?'}
                                                    </div>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                                                        {lead.prospectName || '—'}
                                                    </span>
                                                </div>
                                                {lead.leadType && STATUS_COLORS[lead.leadType] && (
                                                    <span style={{
                                                        fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                                                        padding: '3px 8px', borderRadius: 6,
                                                        background: STATUS_COLORS[lead.leadType].bg,
                                                        color: STATUS_COLORS[lead.leadType].text,
                                                        border: `1px solid ${STATUS_COLORS[lead.leadType].border}`
                                                    }}>
                                                        {lead.leadType.replace(' Lead', '')}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Secondary: Phone/Notes */}
                                            {lead.phoneNumber && (
                                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8, fontWeight: 500 }}>
                                                    <span style={{ opacity: 0.7 }}>📞</span> {lead.phoneNumber}
                                                </div>
                                            )}

                                            {lead.notes && (
                                                <div style={{
                                                    fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4,
                                                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                                    padding: '8px 10px', borderRadius: 10, background: 'rgba(0,0,0,0.15)',
                                                    border: '1px solid rgba(255,255,255,0.03)', fontWeight: 400
                                                }}>
                                                    {lead.notes}
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ display: 'flex', gap: 5 }}>
                                                    {STAGES.filter(s => s.id !== stage.id && s.id !== 'new' && s.id !== 'followup' && s.id !== 'meeting' && s.id !== 'proposal' && s.id !== 'closed').slice(0, 3).map(s => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => handleMoveStage(lead._id, s.id)}
                                                            style={{
                                                                padding: '5px',
                                                                background: 'rgba(255,255,255,0.04)',
                                                                border: '1px solid rgba(255,255,255,0.07)',
                                                                borderRadius: 7,
                                                                cursor: 'pointer',
                                                                transition: 'all 0.15s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: 26,
                                                                height: 26,
                                                                fontSize: '0.7rem'
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.borderColor = `${s.color}60`; e.currentTarget.style.background = `${s.color}12`; }}
                                                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                                                            title={`Move to ${s.label}`}
                                                        >
                                                            {s.emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                                {lead.followUpDate && (
                                                    <span style={{
                                                        fontSize: '0.65rem',
                                                        fontWeight: 800,
                                                        color: new Date(lead.followUpDate) < new Date() ? '#f87171' : 'rgba(255,255,255,0.35)',
                                                        background: new Date(lead.followUpDate) < new Date() ? 'rgba(220,38,38,0.1)' : 'rgba(255,255,255,0.04)',
                                                        border: `1px solid ${new Date(lead.followUpDate) < new Date() ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.07)'}`,
                                                        padding: '3px 8px',
                                                        borderRadius: 99
                                                    }}>
                                                        📅 {new Date(lead.followUpDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
