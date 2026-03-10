"use client";

import { useEffect, useState } from 'react';

const STAGES = [
    // To-do
    { id: 'contacted', label: 'Contacted', color: '#2563eb', emoji: '🔵' },

    // In progress
    { id: 'waiting for resp.', label: 'Waiting for Resp.', color: '#a2845e', emoji: '🟤' },
    { id: 'follow-up scheduled', label: 'Follow-up Scheduled', color: '#af52de', emoji: '🟣' },
    { id: 'interested', label: 'Interested', color: '#d4af37', emoji: '🟡' },
    { id: 'meeting booked', label: 'Meeting Booked', color: '#10b981', emoji: '📅' },

    // Dead-ends
    { id: 'ghosted', label: 'Ghosted', color: '#6b7280', emoji: '👻' },
    { id: 'meeting booked not convert', label: 'Meeting Booked Not Convert', color: '#f97316', emoji: '⚠️' },
    { id: 'not interested', label: 'Not Interested', color: '#dc2626', emoji: '🔴' },
    { id: 'no show up', label: 'No Show Up', color: '#ff3b30', emoji: '🚫' },

    // Legacy (keep for fallback)
    { id: 'new', label: 'New', color: '#6e6e73', emoji: '🆕' },
    { id: 'followup', label: 'Follow-up', color: '#ff9500', emoji: '🔄' },
    { id: 'meeting', label: 'Meeting Set', color: '#5856d6', emoji: '📅' },
    { id: 'proposal', label: 'Proposal Sent', color: '#ff2d55', emoji: '📋' },
    { id: 'closed', label: 'Client 🎉', color: '#16a34a', emoji: '🤝' },
];

const CHANNELS: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    'dm': { label: 'Instagram DM', icon: '📸', color: '#E1306C', bg: 'rgba(225,48,108,0.1)' },
    'email': { label: 'Email', icon: '📧', color: '#0071e3', bg: 'rgba(0,113,227,0.1)' },
    'whatsapp': { label: 'WhatsApp', icon: '💬', color: '#25D366', bg: 'rgba(37,211,102,0.1)' },
    'call': { label: 'Cold Call', icon: '📞', color: '#5856d6', bg: 'rgba(88,86,214,0.1)' },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'Hot lead': { bg: '#fef2f2', text: '#dc2626', border: 'rgba(220,38,38,0.2)' },
    'Qualified': { bg: '#f0fdf4', text: '#16a34a', border: 'rgba(22,163,74,0.2)' },
    'Soft lead': { bg: '#eff6ff', text: '#2563eb', border: 'rgba(37,99,235,0.2)' },
    'Unqualified Lead': { bg: '#fafafa', text: '#6b7280', border: 'rgba(107,114,128,0.2)' },
};

// Map old leadType to a pipeline stage
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
        // Optimistic update
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
            {/* Premium hero banner */}
            <div className="page-hero" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #2563eb 100%)', marginBottom: 24 }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔄</div>
                    <h1 className="page-hero-title">Pipeline Board</h1>
                    <p className="page-hero-sub">{leads.length} leads tracked &middot; {totalValue} closed &middot; Drag cards to update stage</p>
                    <div className="page-hero-actions">
                        <a href="/leads"><button className="btn-hero btn-hero-primary">+ Add Lead</button></a>
                    </div>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="card card-p" style={{ marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12 }}>
                    {STAGES.filter(s => s.id !== 'new' && s.id !== 'followup' && s.id !== 'meeting' && s.id !== 'proposal' && s.id !== 'closed').map((stage, idx) => {
                        const count = groupedLeads[stage.id]?.length || 0;
                        const pct = leads.length > 0 ? (count / leads.length * 100) : 0;
                        return (
                            <div key={stage.id} style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', transition: 'transform var(--t-fast)' }} className="card-hover">
                                <div className="form-label-premium" style={{ marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stage.label}</div>
                                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: stage.color }}>{count}</div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{pct.toFixed(0)}%</div>
                            </div>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', marginTop: 14, borderRadius: 99, overflow: 'hidden', height: 5, background: 'var(--bg-secondary)' }}>
                    {STAGES.map(stage => {
                        const count = groupedLeads[stage.id]?.length || 0;
                        const pct = leads.length > 0 ? (count / leads.length * 100) : 0;
                        return pct > 0 ? <div key={stage.id} style={{ flex: count, background: stage.color, transition: 'flex 0.5s ease' }} /> : null;
                    })}
                    {leads.length === 0 && <div style={{ flex: 1, background: 'var(--border)' }} />}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
                    {STAGES.map(s => (
                        <div key={s.id} style={{ flex: '0 0 260px', background: 'var(--bg-secondary)', borderRadius: 16, height: 200, border: '1px solid var(--border)' }} className="skeleton" />
                    ))}
                </div>
            ) : (
                <div className="kanban-board" style={{ overflowX: 'auto', paddingBottom: 16 }}>
                    {STAGES.map(stage => (
                        <div
                            key={stage.id}
                            className="kanban-col"
                            style={{ border: hoveredCol === stage.id ? `2px solid ${stage.color}` : '1px solid var(--border)', transition: 'border-color 0.2s ease' }}
                            onDragOver={e => { e.preventDefault(); setHoveredCol(stage.id); }}
                            onDragLeave={() => setHoveredCol(null)}
                            onDrop={async e => {
                                e.preventDefault();
                                if (dragging) await handleMoveStage(dragging, stage.id);
                                setDragging(null);
                                setHoveredCol(null);
                            }}
                        >
                            <div className="kanban-col-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: stage.color }} />
                                    <span className="kanban-col-title">{stage.label}</span>
                                </div>
                                <span className="kanban-col-count">{groupedLeads[stage.id]?.length || 0}</span>
                            </div>

                            <div className="kanban-cards">
                                {!groupedLeads[stage.id]?.length ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8125rem', border: '1px dashed var(--border-medium)', borderRadius: 8, background: 'var(--bg)' }}>
                                        Drop leads here
                                    </div>
                                ) : (
                                    groupedLeads[stage.id].map(lead => (
                                        <div
                                            key={lead._id}
                                            className="kanban-card"
                                            draggable
                                            onDragStart={() => setDragging(lead._id)}
                                            onDragEnd={() => setDragging(null)}
                                            style={{ opacity: dragging === lead._id ? 0.5 : 1, padding: '12px 14px' }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                                <div className="kanban-card-title" style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 0 }}>{lead.companyName}</div>
                                                {lead.channel && CHANNELS[lead.channel] && (
                                                    <span style={{ fontSize: '1rem' }} title={CHANNELS[lead.channel].label}>
                                                        {CHANNELS[lead.channel].icon}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="kanban-card-sub" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontWeight: 600 }}>{lead.prospectName || '—'}</span>
                                                {lead.leadType && STATUS_COLORS[lead.leadType] && (
                                                    <span style={{
                                                        fontSize: '0.625rem',
                                                        fontWeight: 900,
                                                        textTransform: 'lowercase',
                                                        letterSpacing: '0.02em',
                                                        padding: '1px 6px',
                                                        borderRadius: 4,
                                                        background: STATUS_COLORS[lead.leadType].bg,
                                                        color: STATUS_COLORS[lead.leadType].text,
                                                        border: `1px solid ${STATUS_COLORS[lead.leadType].border}`
                                                    }}>
                                                        {lead.leadType.replace(' Lead', '')}
                                                    </span>
                                                )}
                                            </div>

                                            {(lead.phoneNumber || lead.email) && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                                                    {lead.phoneNumber && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{ opacity: 0.6 }}>📞</span> {lead.phoneNumber}
                                                        </div>
                                                    )}
                                                    {lead.email && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <span style={{ opacity: 0.6 }}>📧</span> {lead.email}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {lead.notes && (
                                                <p style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-tertiary)',
                                                    lineHeight: 1.5,
                                                    marginBottom: 12,
                                                    overflow: 'hidden',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    background: 'var(--bg-secondary)',
                                                    padding: '6px 8px',
                                                    borderRadius: 6
                                                }}>
                                                    {lead.notes}
                                                </p>
                                            )}

                                            <div className="kanban-card-footer" style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border-light)' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {STAGES.filter(s => s.id !== stage.id && s.id !== 'new' && s.id !== 'followup' && s.id !== 'meeting' && s.id !== 'proposal' && s.id !== 'closed').slice(0, 3).map(s => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => handleMoveStage(lead._id, s.id)}
                                                            style={{
                                                                fontSize: '0.6875rem',
                                                                padding: '4px 8px',
                                                                background: 'var(--bg-secondary)',
                                                                border: '1px solid var(--border)',
                                                                borderRadius: 6,
                                                                cursor: 'pointer',
                                                                color: 'var(--text-secondary)',
                                                                fontWeight: 600,
                                                                transition: 'all 0.15s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 4
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
                                                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                                                            title={`Move to ${s.label}`}
                                                        >
                                                            {s.emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                                {lead.followUpDate && (
                                                    <span style={{
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 700,
                                                        color: new Date(lead.followUpDate) < new Date() ? 'var(--danger)' : 'var(--text-tertiary)',
                                                        background: 'var(--bg-secondary)',
                                                        padding: '2px 6px',
                                                        borderRadius: 4
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
