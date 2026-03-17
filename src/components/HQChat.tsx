"use client";

import { useState, useEffect, useRef } from 'react';
import { useUser } from './UserContext';
import { format } from 'date-fns';

interface IHQMessage {
    _id: string;
    channel: string;
    sender: 'Moksh' | 'smit';
    content: string;
    attachmentData?: string;
    attachmentType?: string;
    attachmentName?: string;
    replyTo?: IHQMessage;
    edited?: boolean;
    createdAt: string;
}

// Apple iMessage-style sent sound — filtered noise swoosh + soft chime
function playSendSound() {
    try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = ctx.currentTime;

        // --- Part 1: Noise swoosh (the "whoosh" sweep) ---
        const bufSize = ctx.sampleRate * 0.18;
        const noiseBuffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) noiseData[i] = Math.random() * 2 - 1;

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(800, now);
        bandpass.frequency.linearRampToValueAtTime(4000, now + 0.15);
        bandpass.Q.value = 1.2;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.18, now + 0.03);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        noiseSource.connect(bandpass);
        bandpass.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        noiseSource.start(now);
        noiseSource.stop(now + 0.18);

        // --- Part 2: Soft chime ping (two harmonics like a bell) ---
        const playChime = (freq: number, gainAmt: number, delay: number) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(0, now + delay);
            gain.gain.linearRampToValueAtTime(gainAmt, now + delay + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + delay);
            osc.stop(now + delay + 0.35);
        };

        playChime(1318, 0.10, 0.10); // E6 - fundamental
        playChime(2637, 0.05, 0.10); // E7 - octave harmonic (softer)
        playChime(1760, 0.04, 0.16); // A6 - subtle follow-up ping

        setTimeout(() => ctx.close(), 800);
    } catch {}
}

export default function HQChat({ channel }: { channel: string }) {
    const { currentUser } = useUser();
    const [messages, setMessages] = useState<IHQMessage[]>([]);
    const [loading, setLoading] = useState(true);

    const [content, setContent] = useState('');
    const [attachment, setAttachment] = useState<{ data: string, type: string, name: string } | null>(null);
    const [replyingTo, setReplyingTo] = useState<IHQMessage | null>(null);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/hq/messages?channel=${encodeURIComponent(channel)}`);
            const json = await res.json();
            if (json.success) setMessages(json.data);
        } catch (err) {
            console.error('Failed to fetch messages', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [channel]);

    // Auto-scroll logic: only scroll if user is near bottom or just sent a message
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
        setShouldAutoScroll(isAtBottom);
    };

    useEffect(() => {
        if (shouldAutoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, shouldAutoScroll]);

    // Auto-resize textarea
    useEffect(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 150) + 'px';
    }, [content]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('File is too large. Please upload files under 5MB.'); return; }
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setAttachment({ data: event.target.result as string, type: file.type, name: file.name });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !attachment) return;

        const payload = {
            channel,
            sender: currentUser,
            content,
            attachmentData: attachment?.data,
            attachmentType: attachment?.type,
            attachmentName: attachment?.name,
            replyTo: replyingTo?._id
        };

        setContent('');
        setAttachment(null);
        setReplyingTo(null);
        if (textareaRef.current) textareaRef.current.style.height = '40px';
        setShouldAutoScroll(true); // Force scroll on send

        try {
            const res = await fetch('/api/hq/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            if (json.success) {
                setMessages(prev => [...prev, json.data]);
                playSendSound(); // 🔊 Apple-style send sound
            }
        } catch (err) {
            console.error('Failed to send message', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this message?')) return;
        try {
            await fetch(`/api/hq/messages/${id}`, { method: 'DELETE' });
            setMessages(prev => prev.filter(m => m._id !== id));
        } catch { console.error('Failed to delete'); }
    };

    const startEdit = (msg: IHQMessage) => {
        setEditingId(msg._id);
        setEditContent(msg.content);
    };

    const handleEdit = async (id: string) => {
        if (!editContent.trim()) return;
        try {
            const res = await fetch(`/api/hq/messages/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: editContent })
            });
            const json = await res.json();
            if (json.success) {
                setMessages(prev => prev.map(m => m._id === id ? { ...m, content: editContent, edited: true } : m));
                setEditingId(null);
            }
        } catch { console.error('Failed to edit'); }
    };

    const renderAttachment = (msg: IHQMessage) => {
        if (!msg.attachmentData) return null;
        if (msg.attachmentType?.startsWith('image/')) {
            return <img src={msg.attachmentData} alt={msg.attachmentName} style={{ maxWidth: '300px', maxHeight: '280px', borderRadius: '10px', marginTop: '6px', border: '1px solid rgba(255,255,255,0.1)', display: 'block' }} />;
        }
        if (msg.attachmentType?.startsWith('video/')) {
            return <video controls style={{ maxWidth: '400px', maxHeight: '280px', borderRadius: '10px', marginTop: '6px', border: '1px solid rgba(255,255,255,0.1)' }}><source src={msg.attachmentData} type={msg.attachmentType} /></video>;
        }
        return (
            <a href={msg.attachmentData} download={msg.attachmentName} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', marginTop: '6px', textDecoration: 'none', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)', maxWidth: '360px' }}>
                <span>📎</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.attachmentName}</span>
            </a>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
            {/* Messages Area */}
            <div 
                onScroll={handleScroll}
                style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 32px', display: 'flex', flexDirection: 'column', gap: '2px' }}
            >
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'rgba(255,255,255,0.5)' }}>Loading channel history...</div>
                ) : messages.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'rgba(255,255,255,0.4)' }}>
                        <span style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</span>
                        <h3 style={{ margin: '0 0 8px', color: 'white' }}>Welcome to # {channel}</h3>
                        <p style={{ margin: 0 }}>This is the start of the channel history.</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const showHeader = index === 0 || messages[index - 1].sender !== msg.sender ||
                            new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 5 * 60 * 1000;
                        const isOwn = msg.sender === currentUser;

                        return (
                            <div
                                key={msg._id}
                                className="chat-message-group"
                                style={{ display: 'flex', gap: '12px', marginTop: showHeader ? '16px' : '1px', position: 'relative' }}
                            >
                                {showHeader ? (
                                    <img 
                                        src={msg.sender === 'Moksh' ? '/moksh.png' : '/smit.png'} 
                                        alt={msg.sender}
                                        style={{ 
                                            width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, 
                                            objectFit: 'cover', marginTop: '2px',
                                            border: `1.5px solid ${msg.sender === 'Moksh' ? 'var(--accent)' : 'var(--info)'}`
                                        }} 
                                    />
                                ) : (
                                    <div style={{ width: '36px', flexShrink: 0 }} />
                                )}

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {showHeader && (
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '3px' }}>
                                            <span style={{ fontWeight: 600, color: isOwn ? '#a855f7' : 'white', fontSize: '0.9rem' }}>{msg.sender}</span>
                                            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{format(new Date(msg.createdAt), 'MMM d, h:mm a')}</span>
                                        </div>
                                    )}

                                    {/* Reply context */}
                                    {msg.replyTo && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '3px 10px', borderLeft: '2px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', marginBottom: '4px', fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)' }}>
                                            <span>↳</span>
                                            <span style={{ fontWeight: 600 }}>{msg.replyTo.sender}</span>
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{msg.replyTo.content || 'Attached a file'}</span>
                                        </div>
                                    )}

                                    {/* Message content or edit mode */}
                                    {editingId === msg._id ? (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', marginTop: '2px' }}>
                                            <textarea
                                                value={editContent}
                                                onChange={e => setEditContent(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(msg._id); } if (e.key === 'Escape') setEditingId(null); }}
                                                autoFocus
                                                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(168,85,247,0.5)', borderRadius: '8px', color: 'white', padding: '8px 12px', fontSize: '0.95rem', outline: 'none', resize: 'none', lineHeight: 1.5 }}
                                                rows={2}
                                            />
                                            <button onClick={() => handleEdit(msg._id)} style={{ background: 'var(--accent)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Save</button>
                                            <button onClick={() => setEditingId(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                                        </div>
                                    ) : (
                                        <div style={{ lineHeight: 1.5, color: 'rgba(255,255,255,0.9)', fontSize: '0.95rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                            {msg.content.split(/(@smit|@Moksh)/g).map((part, i) =>
                                                (part === '@smit' || part === '@Moksh')
                                                    ? <span key={i} style={{ background: 'rgba(168,85,247,0.2)', color: '#d8b4fe', padding: '0 4px', borderRadius: '4px', fontWeight: 600 }}>{part}</span>
                                                    : part
                                            )}
                                            {msg.edited && <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)', marginLeft: '6px' }}>(edited)</span>}
                                        </div>
                                    )}

                                    {renderAttachment(msg)}

                                    {/* Hover action buttons */}
                                    {editingId !== msg._id && (
                                        <div className="message-actions" style={{ display: 'flex', gap: '4px', marginTop: '3px', opacity: 0, transition: 'opacity 0.15s' }}>
                                            <button
                                                onClick={() => setReplyingTo(msg)}
                                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                                            >↩ Reply</button>
                                            {isOwn && (
                                                <>
                                                    <button
                                                        onClick={() => startEdit(msg)}
                                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px' }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                                                    >✏️ Edit</button>
                                                    <button
                                                        onClick={() => handleDelete(msg._id)}
                                                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '4px' }}
                                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
                                                    >🗑️ Delete</button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ padding: '0 24px 20px' }}>
                <div
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.45)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                    {replyingTo && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', fontSize: '0.82rem' }}>
                            <div style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span>↩ Replying to <strong>{replyingTo.sender}</strong></span>
                                <span style={{ opacity: 0.5 }}>{replyingTo.content.substring(0, 40)}{replyingTo.content.length > 40 ? '...' : ''}</span>
                            </div>
                            <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                        </div>
                    )}

                    {attachment && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d8b4fe' }}>
                                <span>📎</span>
                                <strong>{attachment.name}</strong>
                            </div>
                            <button onClick={() => setAttachment(null)} style={{ background: 'none', border: 'none', color: '#d8b4fe', cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px' }}>×</button>
                        </div>
                    )}

                    <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '38px', height: '38px', borderRadius: '50%', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                            title="Attach File"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                        </button>
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />

                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                            }}
                            placeholder={`Message #${channel}`}
                            style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '0.95rem', outline: 'none', resize: 'none', height: '38px', maxHeight: '150px', padding: '9px 0', fontFamily: 'inherit', lineHeight: 1.5, overflowY: 'auto' }}
                        />

                        <button
                            type="submit"
                            disabled={!content.trim() && !attachment}
                            style={{ background: content.trim() || attachment ? '#a855f7' : 'rgba(255,255,255,0.08)', border: 'none', width: '38px', height: '38px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: content.trim() || attachment ? 'pointer' : 'not-allowed', flexShrink: 0, transition: 'all 0.2s', opacity: content.trim() || attachment ? 1 : 0.45 }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </form>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', marginTop: '6px' }}>
                    <strong>Return</strong> to send · <strong>Shift+Return</strong> for new line · <strong>@smit</strong> or <strong>@Moksh</strong> to ping
                </div>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                .chat-message-group:hover .message-actions { opacity: 1 !important; }
                .chat-message-group:hover { background: rgba(255,255,255,0.015); border-radius: 6px; }
            `}} />
        </div>
    );
}
