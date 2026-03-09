"use client";

import { useEffect, useState } from 'react';

const STAGES = [
    { id: 'new', label: 'New', color: '#6e6e73', emoji: '🆕' },
    { id: 'contacted', label: 'Contacted', color: '#0071e3', emoji: '📞' },
    { id: 'followup', label: 'Follow-up', color: '#ff9500', emoji: '🔄' },
    { id: 'meeting', label: 'Meeting Set', color: '#5856d6', emoji: '📅' },
    { id: 'proposal', label: 'Proposal Sent', color: '#ff2d55', emoji: '📋' },
    { id: 'closed', label: 'Client 🎉', color: '#30d158', emoji: '🤝' },
];

// Map old leadType to a pipeline stage
function getStage(lead: any) {
    if (lead.pipelineStage) return lead.pipelineStage;
    if (lead.leadType === 'UN-QUALIFIED') return 'new';
    if (lead.leadType === 'Pending') return 'contacted';
    if (lead.leadType === 'Soft Lead') return 'followup';
    if (lead.leadType === 'Qualified') return 'meeting';
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
            <div className="page-header">
                <div>
                    <h1 className="page-title">Pipeline Board</h1>
                    <p className="page-subtitle">{leads.length} total leads tracked · {totalValue} closed</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <a href="/leads"><button className="btn btn-primary">+ Add Lead</button></a>
                </div>
            </div>

            {/* Summary Bar */}
            <div className="card card-p" style={{ marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0 }}>
                    {STAGES.map((stage, idx) => {
                        const count = groupedLeads[stage.id]?.length || 0;
                        const pct = leads.length > 0 ? (count / leads.length * 100) : 0;
                        return (
                            <div key={stage.id} style={{ textAlign: 'center', padding: '0 8px', borderRight: idx < STAGES.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stage.label}</div>
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
                <div className="kanban-board" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    <style>{`.kanban-board::-webkit-scrollbar { display: none; }`}</style>
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
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8125rem', border: '1.5px dashed var(--border)', borderRadius: 10 }}>
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
                                            style={{ opacity: dragging === lead._id ? 0.5 : 1 }}
                                        >
                                            <div className="kanban-card-title">{lead.companyName}</div>
                                            <div className="kanban-card-sub" style={{ marginBottom: 8 }}>{lead.prospectName || '—'}</div>
                                            {lead.notes && <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.4, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{lead.notes}</p>}
                                            <div className="kanban-card-footer">
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {STAGES.filter(s => s.id !== stage.id).slice(0, 2).map(s => (
                                                        <button
                                                            key={s.id}
                                                            onClick={() => handleMoveStage(lead._id, s.id)}
                                                            style={{ fontSize: '0.6875rem', padding: '3px 7px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, transition: 'all 0.15s' }}
                                                            title={`Move to ${s.label}`}
                                                        >{s.emoji}</button>
                                                    ))}
                                                </div>
                                                {lead.followUpDate && (
                                                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
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
