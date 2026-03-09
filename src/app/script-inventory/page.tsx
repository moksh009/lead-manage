"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';

type Channel = 'instagram' | 'whatsapp' | 'email' | 'call' | 'other';

interface IScript {
    _id: string;
    title: string;
    content: string;
    channel: Channel;
    createdAt: string;
    updatedAt: string;
}

const CHANNEL_CONFIG: Record<Channel, { icon: string; color: string; bg: string }> = {
    instagram: { icon: '📸', color: '#e1306c', bg: 'rgba(225, 48, 108, 0.1)' },
    whatsapp: { icon: '💬', color: '#25d366', bg: 'rgba(37, 211, 102, 0.1)' },
    email: { icon: '✉️', color: '#ea4335', bg: 'rgba(234, 67, 53, 0.1)' },
    call: { icon: '📞', color: '#34a853', bg: 'rgba(52, 168, 83, 0.1)' },
    other: { icon: '📄', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
};

export default function ScriptInventoryPage() {
    const [scripts, setScripts] = useState<IScript[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingScript, setEditingScript] = useState<IScript | null>(null);
    const [filterChannel, setFilterChannel] = useState<Channel | 'all'>('all');

    const [form, setForm] = useState({
        title: '',
        content: '',
        channel: 'instagram' as Channel
    });

    const fetchScripts = async () => {
        try {
            const res = await fetch('/api/scripts');
            const json = await res.json();
            if (json.success) setScripts(json.data);
        } catch (err) {
            console.error('Failed to fetch scripts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchScripts(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingScript ? `/api/scripts/${editingScript._id}` : '/api/scripts';
        const method = editingScript ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });

        const json = await res.json();
        if (json.success) {
            setShowModal(false);
            setEditingScript(null);
            setForm({ title: '', content: '', channel: 'instagram' });
            fetchScripts();
        }
    };

    const openEdit = (script: IScript) => {
        setEditingScript(script);
        setForm({ title: script.title, content: script.content, channel: script.channel });
        setShowModal(true);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this script?')) return;
        await fetch(`/api/scripts/${id}`, { method: 'DELETE' });
        fetchScripts();
    };

    const filteredScripts = filterChannel === 'all'
        ? scripts
        : scripts.filter(s => s.channel === filterChannel);

    return (
        <div className="animate-in">
            <div className="page-hero">
                <div className="page-hero-title">Script Inventory</div>
                <div className="page-hero-sub">Manage your high-converting outreach scripts and templates.</div>
                <div className="page-hero-actions">
                    <button className="btn-hero btn-hero-primary" onClick={() => { setEditingScript(null); setForm({ title: '', content: '', channel: 'instagram' }); setShowModal(true); }}>
                        + Create Script
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
                <button
                    onClick={() => setFilterChannel('all')}
                    style={{ padding: '6px 16px', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', background: filterChannel === 'all' ? 'var(--accent)' : 'var(--surface)', color: filterChannel === 'all' ? 'white' : 'var(--text-secondary)', borderColor: filterChannel === 'all' ? 'transparent' : 'var(--border)' }}
                >
                    All Scripts
                </button>
                {(Object.keys(CHANNEL_CONFIG) as Channel[]).map(ch => (
                    <button
                        key={ch}
                        onClick={() => setFilterChannel(ch)}
                        style={{ padding: '6px 16px', borderRadius: 99, fontSize: '0.8125rem', fontWeight: 600, border: '1px solid', cursor: 'pointer', background: filterChannel === ch ? 'var(--accent)' : 'var(--surface)', color: filterChannel === ch ? 'white' : 'var(--text-secondary)', borderColor: filterChannel === ch ? 'transparent' : 'var(--border)' }}
                    >
                        {CHANNEL_CONFIG[ch].icon} {ch.charAt(0).toUpperCase() + ch.slice(1)}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="card card-p"><div className="empty-state">Loading your library...</div></div>
            ) : filteredScripts.length === 0 ? (
                <div className="card card-p">
                    <div className="empty-state">
                        <div className="empty-icon">📄</div>
                        <div className="empty-title">No scripts found</div>
                        <div className="empty-desc">Create your first outreach script to get started.</div>
                    </div>
                </div>
            ) : (
                <div className="grid-auto">
                    {filteredScripts.map(script => (
                        <div key={script._id} className="card card-hover card-p" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 220 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: 8, background: CHANNEL_CONFIG[script.channel].bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                                        {CHANNEL_CONFIG[script.channel].icon}
                                    </div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{script.title}</h3>
                                </div>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(script)} title="Edit Script">✏️</button>
                                    <button className="btn btn-ghost btn-sm" onClick={(e) => handleDelete(script._id, e)} style={{ color: 'var(--danger)' }} title="Delete Script">🗑️</button>
                                </div>
                            </div>
                            <div style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', lineHeight: 1.6 }}>
                                {script.content}
                            </div>
                            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                <span>Updated: {format(new Date(script.updatedAt), 'MMM d, yyyy')}</span>
                                <button className="btn btn-ghost btn-sm" onClick={() => { navigator.clipboard.writeText(script.content); alert('Copied to clipboard!'); }} style={{ fontSize: '0.75rem' }}>📋 Copy</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="glass-overlay" onClick={() => setShowModal(false)} style={{ zIndex: 1000 }}>
                    <div className="glass-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, width: '90%' }}>
                        <div className="glass-modal-header">
                            <h2 className="modal-title">{editingScript ? '✏️ Edit Script' : '✨ Create New Script'}</h2>
                            <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="glass-modal-body">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    <div>
                                        <label className="form-label">Script Title</label>
                                        <input
                                            className="form-input"
                                            placeholder="e.g. Intro Hook - High Ticket"
                                            value={form.title}
                                            onChange={e => setForm({ ...form, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="grid-2">
                                        <div>
                                            <label className="form-label">Target Channel</label>
                                            <select
                                                className="filter-select"
                                                value={form.channel}
                                                onChange={e => setForm({ ...form, channel: e.target.value as Channel })}
                                                style={{ width: '100%' }}
                                                required
                                            >
                                                <option value="instagram">Instagram</option>
                                                <option value="whatsapp">WhatsApp</option>
                                                <option value="email">Email</option>
                                                <option value="call">Call</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="form-label">Content</label>
                                        <textarea
                                            className="form-input"
                                            placeholder="Paste your script here..."
                                            value={form.content}
                                            onChange={e => setForm({ ...form, content: e.target.value })}
                                            rows={12}
                                            style={{ resize: 'vertical', minHeight: 200, lineHeight: 1.6 }}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="glass-modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingScript ? 'Save Changes' : 'Create Script'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
