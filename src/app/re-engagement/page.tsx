"use client";

import { useState, useEffect, useMemo } from 'react';
import { format, addDays } from 'date-fns';
import { useUser } from '@/components/UserContext';

export default function ReEngagementPage() {
    const { currentUser } = useUser();
    const [leads, setLeads] = useState<any[]>([]);
    const [fomoLeads, setFomoLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchStr, setSearchStr] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [leadsRes, fomoRes] = await Promise.all([
                fetch('/api/leads'),
                fetch('/api/fomo')
            ]);
            const leadsJson = await leadsRes.json();
            const fomoJson = await fomoRes.json();
            
            if (leadsJson.success) setLeads(leadsJson.data);
            if (fomoJson.success) setFomoLeads(fomoJson.data);
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const addToFomo = async (lead: any) => {
        try {
            const res = await fetch('/api/fomo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId: lead._id })
            });
            const json = await res.json();
            if (json.success) {
                setFomoLeads(prev => [json.data, ...prev]);
                setSearchStr('');
            } else {
                alert(json.error || "Failed to add lead");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleFomoSent = async (fomoLead: any) => {
        const isSent = !fomoLead.fomoSent;
        const sentAt = isSent ? new Date() : null;
        // Suggest next FOMO in 21 days
        const nextDate = isSent ? addDays(new Date(), 21) : null;

        try {
            const res = await fetch(`/api/fomo/${fomoLead._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    fomoSent: isSent, 
                    sentAt, 
                    nextFomoDate: nextDate 
                })
            });
            const json = await res.json();
            if (json.success) {
                setFomoLeads(prev => prev.map(l => l._id === fomoLead._id ? json.data : l));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const updateNextDate = async (id: string, date: string) => {
        try {
            const res = await fetch(`/api/fomo/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nextFomoDate: new Date(date) })
            });
            const json = await res.json();
            if (json.success) {
                setFomoLeads(prev => prev.map(l => l._id === id ? json.data : l));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const removeFromFomo = async (id: string) => {
        if (!confirm("Remove from re-engagement list?")) return;
        try {
            const res = await fetch(`/api/fomo/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setFomoLeads(prev => prev.filter(l => l._id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const clearAll = async () => {
        if (!confirm("Clear the entire re-engagement list?")) return;
        try {
            const res = await fetch('/api/fomo', { method: 'DELETE' });
            if (res.ok) setFomoLeads([]);
        } catch (err) {
            console.error(err);
        }
    };

    const downloadCSV = () => {
        if (fomoLeads.length === 0) return;
        const headers = [
            'Company', 'Prospect', 'Phone', 'Link', 'Type', 'Stage', 'Channel', 
            'FOMO Status', 'Last Sent', 'Next Follow-up', 'Campaign Notes', 'Lead Original Notes'
        ];
        const csvContent = [
            headers.join(','),
            ...fomoLeads.map(l => [
                `"${(l.leadId?.companyName || '').replace(/"/g, '""')}"`,
                `"${(l.leadId?.prospectName || '').replace(/"/g, '""')}"`,
                `"${(l.leadId?.phoneNumber || '')}"`,
                `"${(l.leadId?.link || '')}"`,
                `"${(l.leadId?.leadType || '')}"`,
                `"${(l.leadId?.pipelineStage || '')}"`,
                `"${(l.leadId?.channel || '')}"`,
                l.fomoSent ? 'Sent' : 'Pending',
                l.sentAt ? format(new Date(l.sentAt), 'yyyy-MM-dd') : '',
                l.nextFomoDate ? format(new Date(l.nextFomoDate), 'yyyy-MM-dd') : '',
                `"${(l.notes || '').replace(/"/g, '""')}"`,
                `"${(l.leadId?.notes || '').replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `re_engagement_full_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const searchResults = useMemo(() => {
        const list = leads.filter(l => !fomoLeads.find(fl => fl.leadId?._id === l._id));
        if (!searchStr) return list.slice(0, 30);
        const q = searchStr.toLowerCase();
        return list.filter(l => 
            (l.companyName?.toLowerCase().includes(q) || l.prospectName?.toLowerCase().includes(q))
        ).slice(0, 30);
    }, [searchStr, leads, fomoLeads]);

    return (
        <div className="animate-in" style={{ paddingBottom: 100 }}>
            {/* Hero Section */}
            <div className="card" style={{ padding: '32px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: '1.5rem', padding: '6px', background: 'rgba(168,85,247,0.1)', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.2)' }}>📣</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', padding: '3px 12px', borderRadius: 99, color: '#d8b4fe' }}>
                            Re-engagement Engine
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 4px 0', background: 'linear-gradient(to right, #ffffff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Potential Hot Leads</h1>
                    <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Engage leads who showed interest but went cold. Send FOMO offers and track follow-ups.</p>
                </div>
            </div>

            {/* Selection & Search */}
            <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 20, border: '1px solid var(--border)', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: 450 }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input 
                                    type="text"
                                    className="form-input"
                                    placeholder="Click to see leads or search..."
                                    value={searchStr}
                                    onChange={e => setSearchStr(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                    style={{ paddingLeft: 40 }}
                                />
                                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                            </div>
                        </div>

                        {/* Search Dropdown */}
                        {isSearchFocused && (
                            <div style={{ 
                                position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, 
                                background: '#1a1b26', border: '1px solid rgba(255,255,255,0.15)', 
                                borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.5)', 
                                zIndex: 1000, overflowY: 'auto', maxHeight: '380px' 
                            }}>
                                {searchResults.length > 0 ? (
                                    <>
                                        <div style={{ padding: '8px 16px', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            {searchStr ? 'Search Results' : 'Available Leads'}
                                        </div>
                                        {searchResults.map(l => (
                                            <div 
                                                key={l._id}
                                                onClick={() => addToFomo(l)}
                                                style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{l.companyName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{l.prospectName || 'No prospect name'}</div>
                                                </div>
                                                <div style={{ color: 'var(--accent)', fontWeight: 800 }}>+ Add</div>
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>No matching leads found</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        {fomoLeads.length > 0 && (
                            <>
                                <button className="btn btn-secondary" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} onClick={clearAll}>Remove All</button>
                                <button className="btn btn-premium" onClick={downloadCSV}>⬇️ Download CSV</button>
                            </>
                        )}
                    </div>
                </div>

                {/* FOMO Table */}
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>Loading re-engagement data...</div>
                ) : fomoLeads.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', border: '2px dashed rgba(255,255,255,0.05)', borderRadius: 16 }}>
                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>📥</div>
                        <h3 style={{ margin: '0 0 8px' }}>No potential leads added yet</h3>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Search for ghosted or interested leads above to start a re-engagement campaign.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                                    <th style={{ padding: '12px 16px' }}>Lead Details</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>FOMO Status</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Last Sent</th>
                                    <th style={{ padding: '12px 16px' }}>Next Follow-up</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {fomoLeads.map(l => (
                                    <tr key={l._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                                <div className="avatar avatar-sm avatar-gradient-2">{l.leadId?.companyName?.[0] || '?'}</div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{l.leadId?.companyName}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                                                        {l.leadId?.prospectName} · {l.leadId?.phoneNumber}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center' }}>
                                            <button 
                                                onClick={() => toggleFomoSent(l)}
                                                style={{ 
                                                    padding: '6px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                                                    background: l.fomoSent ? 'var(--success-light)' : 'rgba(255,255,255,0.05)',
                                                    color: l.fomoSent ? 'var(--success)' : 'var(--text-secondary)',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {l.fomoSent ? '✓ Sent' : 'Mark as Sent'}
                                            </button>
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {l.sentAt ? format(new Date(l.sentAt), 'MMM d, yyyy') : '--'}
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <input 
                                                type="date"
                                                className="form-input"
                                                style={{ padding: '4px 8px', fontSize: '0.85rem', width: 140 }}
                                                value={l.nextFomoDate ? format(new Date(l.nextFomoDate), 'yyyy-MM-dd') : ''}
                                                onChange={e => updateNextDate(l._id, e.target.value)}
                                            />
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <button 
                                                className="btn-icon" 
                                                style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}
                                                onClick={() => removeFromFomo(l._id)}
                                                title="Remove from campaign"
                                            >
                                                ✕
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div style={{ padding: '20px', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 16, display: 'flex', gap: 16 }}>
                <span style={{ fontSize: '1.5rem' }}>💡</span>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <strong>Tip:</strong> When you mark a lead as "Sent", we automatically suggest a follow-up in 21 days. You can adjust this date manually for each lead. These leads remain in your main database; deleting them from here only removes them from this re-engagement campaign.
                </div>
            </div>
        </div>
    );
}
