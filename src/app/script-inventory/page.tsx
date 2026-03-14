"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useUser } from '@/components/UserContext';

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
    instagram: { icon: '📸', color: '#e1306c', bg: 'rgba(225, 48, 108, 0.15)' },
    whatsapp: { icon: '💬', color: '#25d366', bg: 'rgba(37, 211, 102, 0.15)' },
    email: { icon: '✉️', color: '#ea4335', bg: 'rgba(234, 67, 53, 0.15)' },
    call: { icon: '📞', color: '#34a853', bg: 'rgba(52, 168, 83, 0.15)' },
    other: { icon: '📄', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' },
};

export default function ScriptInventoryPage() {
    const { currentUser } = useUser();
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

    const [tagging, setTagging] = useState({
        user: 'none' as 'none' | 'Moksh' | 'smit',
        message: ''
    });

    const [inlineTaggingId, setInlineTaggingId] = useState<string | null>(null);
    const [inlineTagForm, setInlineTagForm] = useState({
        user: 'none' as 'none' | 'Moksh' | 'smit',
        message: ''
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
            // Send Notification if tagged
            if (tagging.user !== 'none' && tagging.message.trim() !== '') {
                await fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipient: tagging.user,
                        sender: currentUser,
                        message: tagging.message,
                        scriptId: json.data._id
                    })
                });
            }

            setShowModal(false);
            setEditingScript(null);
            setForm({ title: '', content: '', channel: 'instagram' });
            setTagging({ user: 'none', message: '' });
            fetchScripts();
        }
    };

    const openEdit = (script: IScript) => {
        setEditingScript(script);
        setForm({ title: script.title, content: script.content, channel: script.channel });
        setTagging({ user: 'none', message: '' });
        setShowModal(true);
    };

    const handleInlineTag = async (scriptId: string) => {
        if (inlineTagForm.user === 'none' || inlineTagForm.message.trim() === '') {
            alert('Please select a user and enter a message');
            return;
        }

        try {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient: inlineTagForm.user,
                    sender: currentUser,
                    message: inlineTagForm.message,
                    scriptId: scriptId
                })
            });
            setInlineTaggingId(null);
            setInlineTagForm({ user: 'none', message: '' });
            alert('Notification sent!');
        } catch (err) {
            console.error('Failed to send notification', err);
        }
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
        <div style={{
            minHeight: '100vh',
            background: '#05050A',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '40px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Dark premium glow background */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                left: '-10%',
                width: '600px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, rgba(0,0,0,0) 70%)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-20%',
                right: '-10%',
                width: '800px',
                height: '800px',
                background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(0,0,0,0) 70%)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: '1400px', margin: '0 auto' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 8px 0', background: 'linear-gradient(to right, #ffffff, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Script Inventory
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', margin: 0, fontWeight: 400 }}>
                            Manage your high-converting outreach scripts and templates
                        </p>
                    </div>
                    <button 
                        onClick={() => { setEditingScript(null); setForm({ title: '', content: '', channel: 'instagram' }); setTagging({ user: 'none', message: '' }); setShowModal(true); }}
                        style={{
                            background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(147, 51, 234, 0.4)',
                            transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 25px rgba(147, 51, 234, 0.6)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(147, 51, 234, 0.4)'; }}
                    >
                        + Create Script
                    </button>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setFilterChannel('all')}
                        style={{
                            padding: '8px 20px',
                            borderRadius: '100px',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: filterChannel === 'all' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            color: filterChannel === 'all' ? '#d8b4fe' : 'rgba(255, 255, 255, 0.6)',
                            border: filterChannel === 'all' ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                            transition: 'all 0.2s',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        All Scripts
                    </button>
                    {(Object.keys(CHANNEL_CONFIG) as Channel[]).map(ch => (
                        <button
                            key={ch}
                            onClick={() => setFilterChannel(ch)}
                            style={{
                                padding: '8px 20px',
                                borderRadius: '100px',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                background: filterChannel === ch ? CHANNEL_CONFIG[ch].bg : 'rgba(255, 255, 255, 0.05)',
                                color: filterChannel === ch ? 'white' : 'rgba(255, 255, 255, 0.6)',
                                border: filterChannel === ch ? `1px solid ${CHANNEL_CONFIG[ch].color}` : '1px solid rgba(255, 255, 255, 0.1)',
                                transition: 'all 0.2s',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>{CHANNEL_CONFIG[ch].icon}</span>
                            <span>{ch.charAt(0).toUpperCase() + ch.slice(1)}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#a855f7', fontSize: '1.2rem', fontWeight: 600 }}>
                        <div style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>Loading your library...</div>
                    </div>
                ) : filteredScripts.length === 0 ? (
                    <div style={{ 
                        background: 'rgba(255, 255, 255, 0.03)', 
                        border: '1px solid rgba(255, 255, 255, 0.05)', 
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px', 
                        padding: '80px 40px', 
                        textAlign: 'center' 
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.8 }}>📄</div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px 0' }}>No scripts found</h3>
                        <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '1rem' }}>Create your first outreach script to get started.</p>
                    </div>
                ) : (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
                        gap: '24px' 
                    }}>
                        {filteredScripts.map(script => (
                            <div 
                                key={script._id} 
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    backdropFilter: 'blur(20px)',
                                    borderRadius: '20px',
                                    padding: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    height: '280px',
                                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => { 
                                    e.currentTarget.style.transform = 'translateY(-4px)'; 
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
                                    e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(168, 85, 247, 0.2)';
                                }}
                                onMouseLeave={(e) => { 
                                    e.currentTarget.style.transform = 'translateY(0)'; 
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ 
                                            width: '40px', height: '40px', borderRadius: '12px', 
                                            background: CHANNEL_CONFIG[script.channel].bg, 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' 
                                        }}>
                                            {CHANNEL_CONFIG[script.channel].icon}
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'white', letterSpacing: '-0.01em' }}>
                                            {script.title}
                                        </h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button 
                                            onClick={() => openEdit(script)} 
                                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                                            title="Edit Script"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(script._id, e)} 
                                            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: 'all 0.2s' }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                                            title="Delete Script"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        </button>
                                    </div>
                                </div>
                                <div style={{ 
                                    flex: 1, 
                                    fontSize: '0.95rem', 
                                    color: 'rgba(255, 255, 255, 0.7)', 
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap', 
                                    overflow: 'hidden', 
                                    display: '-webkit-box', 
                                    WebkitLineClamp: 5, 
                                    WebkitBoxOrient: 'vertical',
                                }}>
                                    {script.content}
                                </div>
                                <div style={{ 
                                    marginTop: 'auto', 
                                    paddingTop: '16px', 
                                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    fontSize: '0.8rem', 
                                    color: 'rgba(255, 255, 255, 0.4)' 
                                }}>
                                    <span>{format(new Date(script.updatedAt), 'MMM d, yyyy')}</span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            onClick={() => {
                                                if (inlineTaggingId === script._id) {
                                                    setInlineTaggingId(null);
                                                } else {
                                                    setInlineTaggingId(script._id);
                                                    setInlineTagForm({ user: 'none', message: '' });
                                                }
                                            }}
                                            style={{ 
                                                background: 'rgba(59, 130, 246, 0.1)', 
                                                border: '1px solid rgba(59, 130, 246, 0.2)', 
                                                color: '#93c5fd', 
                                                padding: '6px 12px', 
                                                borderRadius: '6px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 600, 
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'; e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'; e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.2)'; }}
                                        >
                                            @{inlineTaggingId === script._id ? 'Cancel' : 'Tag Team'}
                                        </button>
                                        <button 
                                            onClick={() => { navigator.clipboard.writeText(script.content); alert('Copied to clipboard!'); }} 
                                            style={{ 
                                                background: 'rgba(168, 85, 247, 0.1)', 
                                                border: '1px solid rgba(168, 85, 247, 0.2)', 
                                                color: '#d8b4fe', 
                                                padding: '6px 12px', 
                                                borderRadius: '6px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 600, 
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)'; e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.1)'; e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.2)'; }}
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                </div>

                                {/* Inline Tagging UI */}
                                {inlineTaggingId === script._id && (
                                    <div style={{ 
                                        marginTop: '16px', 
                                        padding: '16px', 
                                        background: 'rgba(168, 85, 247, 0.05)', 
                                        border: '1px solid rgba(168, 85, 247, 0.15)', 
                                        borderRadius: '12px',
                                        animation: 'fadeIn 0.2s ease-out'
                                    }}>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                            <button 
                                                onClick={() => setInlineTagForm({ ...inlineTagForm, user: 'Moksh' })}
                                                style={{ 
                                                    flex: 1, padding: '6px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                                                    background: inlineTagForm.user === 'Moksh' ? '#a855f7' : 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'white', transition: 'all 0.2s'
                                                }}
                                            >@Moksh</button>
                                            <button 
                                                onClick={() => setInlineTagForm({ ...inlineTagForm, user: 'smit' })}
                                                style={{ 
                                                    flex: 1, padding: '6px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                                                    background: inlineTagForm.user === 'smit' ? '#a855f7' : 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'white', transition: 'all 0.2s'
                                                }}
                                            >@Smit</button>
                                        </div>
                                        <input 
                                            placeholder="Write a message..."
                                            value={inlineTagForm.message}
                                            onChange={e => setInlineTagForm({ ...inlineTagForm, message: e.target.value })}
                                            style={{ 
                                                width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', 
                                                padding: '8px 12px', borderRadius: '8px', color: 'white', fontSize: '0.85rem', outline: 'none',
                                                marginBottom: '12px', boxSizing: 'border-box'
                                            }}
                                        />
                                        <button 
                                            onClick={() => handleInlineTag(script._id)}
                                            style={{ 
                                                width: '100%', background: 'var(--accent-gradient)', border: 'none', color: 'white', 
                                                padding: '8px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer'
                                            }}
                                        >
                                            Send Notification
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Premium Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{
                        background: '#0a0a0f',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '650px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(168, 85, 247, 0.15)',
                        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}>
                        {/* Modal Header */}
                        <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ margin: '0 0 4px 0', fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                                    {editingScript ? 'Edit Script' : 'Create Script'}
                                </h2>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                                    {editingScript ? 'Update your template details.' : 'Design a new high-converting outreach message.'}
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)}
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
                            <form id="script-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Script Title</label>
                                    <input
                                        placeholder="e.g. Intro Hook - High Ticket"
                                        value={form.title}
                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                        required
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = '#a855f7'; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Target Channel</label>
                                    <select
                                        value={form.channel}
                                        onChange={e => setForm({ ...form, channel: e.target.value as Channel })}
                                        required
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', appearance: 'none', boxSizing: 'border-box' }}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = '#a855f7'; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                    >
                                        <option value="instagram" style={{ background: '#0a0a0f' }}>📸 Instagram</option>
                                        <option value="whatsapp" style={{ background: '#0a0a0f' }}>💬 WhatsApp</option>
                                        <option value="email" style={{ background: '#0a0a0f' }}>✉️ Email</option>
                                        <option value="call" style={{ background: '#0a0a0f' }}>📞 Call</option>
                                        <option value="other" style={{ background: '#0a0a0f' }}>📄 Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Content Template</label>
                                    <textarea
                                        placeholder="Type your message here... Use [Name] or [Company] for personalization."
                                        value={form.content}
                                        onChange={e => setForm({ ...form, content: e.target.value })}
                                        required
                                        rows={8}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', resize: 'vertical', minHeight: '150px', lineHeight: 1.6, boxSizing: 'border-box' }}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = '#a855f7'; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                    />
                                </div>

                                {/* Tagging Functionality inside a styled box */}
                                <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '20px', borderRadius: '16px' }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: '#d8b4fe', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                                        Notify Team Member
                                    </h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Tag User (Optional)</label>
                                            <select
                                                value={tagging.user}
                                                onChange={e => setTagging({ ...tagging, user: e.target.value as 'none' | 'Moksh' | 'smit' })}
                                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '10px', color: 'white', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                            >
                                                <option value="none" style={{ background: '#0a0a0f' }}>Nobody</option>
                                                {currentUser === 'smit' && <option value="Moksh" style={{ background: '#0a0a0f' }}>@Moksh</option>}
                                                {currentUser === 'Moksh' && <option value="smit" style={{ background: '#0a0a0f' }}>@smit</option>}
                                            </select>
                                        </div>
                                        
                                        {tagging.user !== 'none' && (
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>Custom Message</label>
                                                <input
                                                    placeholder={`E.g. "Hey ${tagging.user}, check out this new script!"`}
                                                    value={tagging.message}
                                                    onChange={e => setTagging({ ...tagging, message: e.target.value })}
                                                    required={tagging.user !== ('none' as string)}
                                                    style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 14px', borderRadius: '10px', color: 'white', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
                            <button 
                                type="button" 
                                onClick={() => setShowModal(false)}
                                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '12px 24px', borderRadius: '12px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                form="script-form"
                                style={{
                                    background: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 20px rgba(147, 51, 234, 0.4)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 25px rgba(147, 51, 234, 0.6)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(147, 51, 234, 0.4)'; }}
                            >
                                {editingScript ? 'Save Changes' : 'Create Script'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
            `}} />
        </div>
    );
}
