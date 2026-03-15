"use client";

import { useState, useEffect } from 'react';
import { useUser } from './UserContext';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface INotification {
    _id: string;
    recipient: string;
    sender: string;
    message: string;
    scriptId?: string;
    read: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const { currentUser } = useUser();
    const router = useRouter();
    const [notifications, setNotifications] = useState<INotification[]>([]);
    const [open, setOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch(`/api/notifications?recipient=${currentUser}`);
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data);
                setUnreadCount(data.data.filter((n: INotification) => !n.read).length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    // Refetch on user change or periodically
    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, [currentUser]);

    const handleMarkAsRead = async (id: string, scriptId?: string) => {
        try {
            await fetch(`/api/notifications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read: true })
            });
            fetchNotifications();
            setOpen(false);
            if (scriptId) {
                router.push(`/script-inventory?highlight=${scriptId}`);
            }

        } catch (error) {
            console.error('Failed to mark notification active', error);
        }
    };

    const handleMarkAllRead = async () => {
        const unread = notifications.filter(n => !n.read);
        for (const notif of unread) {
            await fetch(`/api/notifications/${notif._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read: true })
            });
        }
        fetchNotifications();
    };

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}>
            <div style={{ position: 'relative' }}>
                <button
                    onClick={() => setOpen(!open)}
                    className="notification-fab"
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    {unreadCount > 0 && (
                        <span className="notification-badge">
                            {unreadCount}
                        </span>
                    )}
                </button>


                {open && (
                    <div style={{
                        position: 'absolute',
                        bottom: '120%',
                        right: 0,
                        width: '320px',
                        background: 'rgba(20, 20, 25, 0.95)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        boxShadow: '0 -10px 40px rgba(0,0,0,0.5), 0 0 20px rgba(168, 85, 247, 0.15)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        maxHeight: '400px'
                    }}>
                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'white' }}>Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: '#a855f7', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>
                                    Mark all read
                                </button>
                            )}
                        </div>
                        
                        <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.9rem' }}>
                                    No notifications right now.
                                </div>
                            ) : (
                                notifications.map(notif => (
                                    <div 
                                        key={notif._id} 
                                        onClick={() => handleMarkAsRead(notif._id, notif.scriptId)}
                                        style={{ 
                                            padding: '12px 16px', 
                                            background: notif.read ? 'transparent' : 'rgba(168, 85, 247, 0.1)',
                                            borderLeft: notif.read ? '3px solid transparent' : '3px solid #a855f7',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(168, 85, 247, 0.1)'; }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                            <div style={{ 
                                                width: '32px', height: '32px', borderRadius: '50%', 
                                                background: notif.sender === 'Moksh' ? 'var(--accent)' : 'var(--info)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 'bold', fontSize: '0.8rem', color: 'white', flexShrink: 0
                                            }}>
                                                {notif.sender.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)', marginBottom: '4px', lineHeight: 1.4 }}>
                                                    <span style={{ fontWeight: 600, color: 'white' }}>{notif.sender}</span> tagged you: 
                                                    <span style={{ fontStyle: 'italic', opacity: 0.8 }}> &quot;{notif.message}&quot;</span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>
                                                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                                </div>
                                            </div>
                                            {!notif.read && (
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7', flexShrink: 0, marginTop: '12px' }} />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
