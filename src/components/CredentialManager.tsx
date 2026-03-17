"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from './UserContext';
import { format } from 'date-fns';

interface IHQCredential {
    _id: string;
    platform: string;
    username: string;
    password?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export default function CredentialManager() {
    const { currentUser } = useUser();
    const [credentials, setCredentials] = useState<IHQCredential[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [revealedPasswords, setRevealedPasswords] = useState<Set<string>>(new Set());
    
    const [form, setForm] = useState({ platform: '', username: '', password: '', notes: '' });
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const fetchCredentials = async () => {
        try {
            const res = await fetch('/api/hq/credentials');
            const json = await res.json();
            if (json.success) setCredentials(json.data);
        } catch (err) {
            console.error('Failed to fetch credentials', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCredentials(); }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/hq/credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const json = await res.json();
            if (json.success) {
                setCredentials(prev => [...prev, json.data].sort((a, b) => a.platform.localeCompare(b.platform)));
                setShowModal(false);
                setForm({ platform: '', username: '', password: '', notes: '' });
            }
        } catch (err) {
            console.error('Failed to save credential', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this credential?')) return;
        try {
            await fetch(`/api/hq/credentials/${id}`, { method: 'DELETE' });
            setCredentials(prev => prev.filter(c => c._id !== id));
        } catch (err) {
            console.error('Failed to delete credential', err);
        }
    };

    const toggleReveal = (id: string) => {
        const newRevealed = new Set(revealedPasswords);
        if (newRevealed.has(id)) newRevealed.delete(id);
        else newRevealed.add(id);
        setRevealedPasswords(newRevealed);
    };

    const copyToClipboard = (text: string, id: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '32px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: 'white' }}>Passwords & Accounts</h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>Securely manage shared agency accounts.</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    style={{
                        background: 'var(--accent)', color: 'white', border: 'none', 
                        padding: '12px 24px', borderRadius: '8px', fontWeight: 600, 
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                        boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
                        transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(168, 85, 247, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.3)';
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>+</span> Add Account
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>Loading credentials...</div>
            ) : credentials.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🔐</span>
                    <h3 style={{ margin: '0 0 8px', color: 'white' }}>No accounts saved yet</h3>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)' }}>Click "Add Account" to store your first shared credential.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {credentials.map(cred => (
                        <div key={cred._id} style={{ 
                            background: 'rgba(255,255,255,0.03)', 
                            border: '1px solid rgba(255,255,255,0.05)', 
                            borderRadius: '16px',
                            padding: '24px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            position: 'relative',
                            transition: 'border-color 0.2s, transform 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                            e.currentTarget.style.transform = 'none';
                        }}
                        >
                            <button 
                                onClick={() => handleDelete(cred._id)}
                                style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ 
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(59,130,246,0.2))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 'bold', fontSize: '1.2rem', color: '#d8b4fe',
                                    border: '1px solid rgba(168, 85, 247, 0.3)'
                                }}>
                                    {cred.platform.charAt(0).toUpperCase()}
                                </div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>{cred.platform}</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', width: '80px' }}>Username</div>
                                    <div style={{ color: 'white', fontWeight: 500, fontFamily: 'monospace', fontSize: '1rem', flex: 1, textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                        {cred.username}
                                    </div>
                                    <button 
                                        onClick={() => copyToClipboard(cred.username, `${cred._id}-user`)}
                                        style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', padding: '4px', opacity: 0.7 }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                                        title="Copy Username"
                                    >
                                        {copiedId === `${cred._id}-user` ? '✓' : '📋'}
                                    </button>
                                </div>
                                
                                {cred.password && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', width: '80px' }}>Password</div>
                                        <div style={{ color: 'white', fontWeight: 500, fontFamily: 'monospace', fontSize: '1rem', flex: 1, letterSpacing: revealedPasswords.has(cred._id) ? 'normal' : '2px' }}>
                                            {revealedPasswords.has(cred._id) ? cred.password : '••••••••••••'}
                                        </div>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button 
                                                onClick={() => toggleReveal(cred._id)}
                                                style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', padding: '4px', opacity: 0.7 }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                                onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                                                title={revealedPasswords.has(cred._id) ? "Hide Password" : "Show Password"}
                                            >
                                                {revealedPasswords.has(cred._id) ? '👁️' : '🙈'}
                                            </button>
                                            <button 
                                                onClick={() => copyToClipboard(cred.password!, `${cred._id}-pass`)}
                                                style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', padding: '4px', opacity: 0.7 }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                                onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
                                                title="Copy Password"
                                            >
                                                {copiedId === `${cred._id}-pass` ? '✓' : '📋'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {cred.notes && (
                                <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                                    <strong>Notes:</strong> {cred.notes}
                                </div>
                            )}
                            
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginTop: 'auto', paddingTop: '8px' }}>
                                Added {format(new Date(cred.createdAt), 'MMM d, yyyy')}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Credential Modal — rendered via portal so it escapes parent overflow/transform */}
            {showModal && createPortal(
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 10000,
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
                                    Add Account
                                </h2>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                                    Securely store a shared team credential.
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
                            <form id="credential-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Platform / Website</label>
                                    <input
                                        required
                                        placeholder="e.g. Gmail, Namecheap, Client X Instantly"
                                        value={form.platform}
                                        onChange={e => setForm({ ...form, platform: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = '#a855f7'; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Username / Email</label>
                                    <input
                                        required
                                        value={form.username}
                                        onChange={e => setForm({ ...form, username: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = '#a855f7'; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Password</label>
                                    <input
                                        type="text"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box', fontFamily: 'monospace' }}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = '#a855f7'; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Notes (Optional)</label>
                                    <textarea
                                        placeholder="2FA keys, recovery emails, etc."
                                        rows={3}
                                        value={form.notes}
                                        onChange={e => setForm({ ...form, notes: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 16px', borderRadius: '12px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s', resize: 'vertical', boxSizing: 'border-box' }}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = '#a855f7'; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                    />
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
                                form="credential-form"
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
                                Save Account
                            </button>
                        </div>
                    </div>
                </div>
            , document.body)}
        </div>
    );
}
