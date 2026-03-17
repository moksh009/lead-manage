"use client";

import { useState } from 'react';
import HQChat from '../../components/HQChat';
import CredentialManager from '../../components/CredentialManager';
import { useSidebar } from '../../components/SidebarContext';

const CHANNELS = [
    { id: 'Finance', name: 'Finance', icon: '💰' },
    { id: 'General', name: 'General', icon: '🌎' },
    { id: 'Passwords and Accounts', name: 'Passwords & Accounts', icon: '🔐' },
    { id: 'Rough Fluff', name: 'Rough Fluff', icon: '🗑️' },
    { id: 'Client Fluff', name: 'Client Fluff', icon: '📁' },
];

export default function HQPage() {
    const [activeChannel, setActiveChannel] = useState(CHANNELS[1].id);
    const { collapsed, isMobile } = useSidebar();
    const sidebarWidth = isMobile ? 0 : (collapsed ? 64 : 260);

    return (
        <div style={{ 
            position: 'fixed', top: 0, right: 0, bottom: 0,
            left: sidebarWidth,
            transition: 'left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            display: 'flex', overflow: 'hidden', background: '#05050A', color: 'white'
        }}>
            {/* Inner Sidebar for Channels */}
            <div style={{ 
                width: '280px', 
                background: 'rgba(255,255,255,0.02)', 
                borderRight: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 0'
            }}>
                <div style={{ padding: '0 20px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>TopEdge HQ</h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>Internal Command Center</p>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
                    {CHANNELS.map(ch => (
                        <button
                            key={ch.id}
                            onClick={() => setActiveChannel(ch.id)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                background: activeChannel === ch.id ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                                border: 'none',
                                borderRadius: '8px',
                                color: activeChannel === ch.id ? 'white' : 'rgba(255,255,255,0.6)',
                                fontSize: '0.95rem',
                                fontWeight: activeChannel === ch.id ? 600 : 500,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                marginBottom: '4px',
                                textAlign: 'left'
                            }}
                            onMouseEnter={(e) => {
                                if (activeChannel !== ch.id) {
                                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                    e.currentTarget.style.color = 'white';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (activeChannel !== ch.id) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                                }
                            }}
                        >
                            <span style={{ fontSize: '1.2rem' }}>{ch.icon}</span>
                            {ch.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute', top: '-10%', right: '-10%', width: '500px', height: '500px',
                    background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, rgba(0,0,0,0) 70%)',
                    zIndex: 0, pointerEvents: 'none'
                }} />
                
                <div style={{ 
                    padding: '24px 32px', 
                    borderBottom: '1px solid rgba(255,255,255,0.05)', 
                    background: 'rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '1.5rem' }}>
                        {CHANNELS.find(c => c.id === activeChannel)?.icon}
                    </span>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>
                        {activeChannel}
                    </h2>
                </div>

                <div style={{ flex: 1, overflow: 'hidden', zIndex: 1 }}>
                    {activeChannel === 'Passwords and Accounts' ? (
                        <CredentialManager />
                    ) : (
                        <HQChat channel={activeChannel} />
                    )}
                </div>
            </div>
        </div>
    );
}
