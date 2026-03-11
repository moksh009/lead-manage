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
            <div className="page-hero" style={{ background: 'var(--accent-gradient)', marginBottom: 24 }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: '1.875rem' }}>🔄</span>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, background: 'rgba(255,255,255,0.2)', padding: '3px 12px', borderRadius: 99, backdropFilter: 'blur(8px)' }}>
                            {leads.length} Leads Tracked
                        </span>
                    </div>
                    <h1 className="page-hero-title">Pipeline Board</h1>
                    <p className="page-hero-sub">{totalValue} closed · Drag cards to update stage</p>
                    <div className="page-hero-actions">
                        <a href="/leads"><button className="btn-hero btn-hero-primary">+ Add Lead</button></a>
                    </div>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="card" style={{ marginBottom: 24, padding: '20px 24px', background: 'var(--surface)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16 }}>
                    {STAGES.filter(s => s.id !== 'new' && s.id !== 'followup' && s.id !== 'meeting' && s.id !== 'proposal' && s.id !== 'closed').map((stage, idx) => {
                        const count = groupedLeads[stage.id]?.length || 0;
                        const pct = leads.length > 0 ? (count / leads.length * 100) : 0;
                        return (
                            <div key={stage.id} style={{ padding: '16px 12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <span style={{ fontSize: '1rem' }}>{stage.emoji}</span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stage.label}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                                    <div style={{ fontWeight: 800, fontSize: '1.75rem', lineHeight: 1, color: stage.color }}>{count}</div>
                                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', fontWeight: 600, paddingBottom: 2 }}>{pct.toFixed(0)}%</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div style={{ display: 'flex', marginTop: 24, borderRadius: 99, overflow: 'hidden', height: 8, background: 'var(--bg-secondary)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)' }}>
                    {STAGES.map(stage => {
                        const count = groupedLeads[stage.id]?.length || 0;
                        const pct = leads.length > 0 ? (count / leads.length * 100) : 0;
                        return pct > 0 ? <div key={stage.id} style={{ width: `${pct}%`, background: stage.color, transition: 'width 0.5s cubic-bezier(0.25, 1, 0.5, 1)' }} title={`${stage.label}: ${count}`} /> : null;
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
                                    <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem', fontWeight: 600, border: '1.5px dashed var(--border-medium)', borderRadius: 12, background: 'var(--bg-secondary)' }}>
                                        Drop leads here
                                    </div>
                                ) : (
                                    groupedLeads[stage.id].map(lead => (
                                        <div
                                            key={lead._id}
                                            className="card card-hover"
                                            draggable
                                            onDragStart={() => setDragging(lead._id)}
                                            onDragEnd={() => setDragging(null)}
                                            style={{
                                                opacity: dragging === lead._id ? 0.4 : 1,
                                                padding: '16px',
                                                cursor: 'grab',
                                                background: 'var(--surface)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 16,
                                                marginBottom: 12,
                                                transform: dragging === lead._id ? 'scale(0.98)' : 'scale(1)',
                                                transition: 'all 0.2s cubic-bezier(0.25, 1, 0.5, 1)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{lead.companyName}</div>
                                                {lead.channel && CHANNELS[lead.channel] && (
                                                    <span style={{ fontSize: '1rem', background: CHANNELS[lead.channel].bg, padding: 4, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={CHANNELS[lead.channel].label}>
                                                        {CHANNELS[lead.channel].icon}
                                                    </span>
                                                )}
                                            </div>

                                            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <span className="avatar avatar-sm avatar-gradient-1" style={{ width: 20, height: 20, fontSize: '0.6rem' }}>{lead.prospectName?.[0] || '?'}</span>
                                                    {lead.prospectName || '—'}
                                                </span>
                                                {lead.leadType && STATUS_COLORS[lead.leadType] && (
                                                    <span style={{
                                                        fontSize: '0.65rem',
                                                        fontWeight: 800,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.04em',
                                                        padding: '3px 8px',
                                                        borderRadius: 99,
                                                        background: STATUS_COLORS[lead.leadType].bg,
                                                        color: STATUS_COLORS[lead.leadType].text,
                                                        border: `1px solid ${STATUS_COLORS[lead.leadType].border}`
                                                    }}>
                                                        {lead.leadType.replace(' Lead', '')}
                                                    </span>
                                                )}
                                            </div>

                                            {(lead.phoneNumber || lead.email) && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                                                    {lead.phoneNumber && (
                                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ opacity: 0.7 }}>📞</span> {lead.phoneNumber}
                                                        </div>
                                                    )}
                                                    {lead.email && (
                                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <span style={{ opacity: 0.7 }}>📧</span> {lead.email}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {lead.notes && (
                                                <div style={{
                                                    fontSize: '0.8125rem',
                                                    color: 'var(--text-secondary)',
                                                    lineHeight: 1.5,
                                                    marginBottom: 16,
                                                    overflow: 'hidden',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    background: 'var(--bg-secondary)',
                                                    padding: '8px 12px',
                                                    borderRadius: 8,
                                                    border: '1px solid var(--border)'
                                                }}>
                                                    {lead.notes}
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {STAGES.filter(s => s.id !== stage.id && s.id !== 'new' && s.id !== 'followup' && s.id !== 'meeting' && s.id !== 'proposal' && s.id !== 'closed').slice(0, 3).map(s => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => handleMoveStage(lead._id, s.id)}
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                padding: '6px',
                                                                background: 'var(--bg-secondary)',
                                                                border: '1px solid var(--border)',
                                                                borderRadius: 8,
                                                                cursor: 'pointer',
                                                                color: 'var(--text-secondary)',
                                                                fontWeight: 600,
                                                                transition: 'all 0.15s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                width: 28,
                                                                height: 28
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.background = 'var(--surface)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                                                            title={`Move to ${s.label}`}
                                                        >
                                                            {s.emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                                {lead.followUpDate && (
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 800,
                                                        color: new Date(lead.followUpDate) < new Date() ? 'var(--danger)' : 'var(--text-secondary)',
                                                        background: new Date(lead.followUpDate) < new Date() ? '#fef2f2' : 'var(--bg-tertiary)',
                                                        border: `1px solid ${new Date(lead.followUpDate) < new Date() ? 'rgba(220,38,38,0.2)' : 'var(--border)'}`,
                                                        padding: '4px 10px',
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
