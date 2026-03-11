"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSidebar } from './SidebarContext';
import { useUser } from './UserContext';

const navItems = [
    { href: '/', icon: '⊞', label: 'Dashboard' },
    { href: '/outreach', icon: '📊', label: 'Daily Outreach Log' },
    { href: '/leads', icon: '🎯', label: 'Leads' },
    { href: '/pipeline', icon: '🔄', label: 'Pipeline Board' },
    { href: '/script-inventory', icon: '📄', label: 'Script Inventory' },
    { href: '/clients', icon: '💼', label: 'Clients & Billing' },
    { href: '/team-goals', icon: '🏆', label: 'Team Goals' },
    { href: '/analytics', icon: '📈', label: 'Analytics' },
    { href: '/rewards', icon: '👑', label: 'Rewards & Points' },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { collapsed, toggle, mobileOpen, setMobileOpen, isMobile } = useSidebar();
    const { currentUser, setCurrentUser } = useUser();

    // Close drawer when route changes
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    const closeMobile = () => setMobileOpen(false);

    return (
        <>
            {/* ── Mobile top bar (visible only on mobile via CSS display:flex) ── */}
            <header className="mobile-header">
                <button
                    className="hamburger-btn"
                    onClick={() => setMobileOpen(prev => !prev)}
                    aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
                >
                    <span className="hamburger-line" style={mobileOpen ? { transform: 'translateY(7px) rotate(45deg)' } : {}} />
                    <span className="hamburger-line" style={mobileOpen ? { opacity: 0, transform: 'scaleX(0)' } : {}} />
                    <span className="hamburger-line" style={mobileOpen ? { transform: 'translateY(-7px) rotate(-45deg)' } : {}} />
                </button>
                <div className="mobile-header-logo">
                    <div style={{
                        width: 30, height: 30, borderRadius: 8,
                        background: 'var(--accent)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 3px 8px rgba(0,113,227,0.3)', flexShrink: 0
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9" />
                            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        TopEdge AI
                    </span>
                </div>
            </header>

            {/* ── Overlay backdrop ── */}
            {mobileOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={closeMobile}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.45)',
                        zIndex: 299,
                        backdropFilter: 'blur(3px)',
                        WebkitBackdropFilter: 'blur(3px)',
                        display: 'block'
                    }}
                />
            )}

            {/* ── Sidebar ── */}
            <aside
                className={`sidebar ${collapsed && !isMobile ? ' sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}
            >
                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9" />
                            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    {!(collapsed && !isMobile) && (
                        <div className="sidebar-logo-text-wrap">
                            <div className="sidebar-logo-text">Top Edge AI</div>
                            <div className="sidebar-logo-sub">Lead Management</div>
                        </div>
                    )}
                    {!isMobile && (
                        <button
                            className="sidebar-collapse-btn"
                            onClick={toggle}
                            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                                style={{ transition: 'transform 0.3s', transform: collapsed ? 'rotate(180deg)' : 'none' }}>
                                <path d="M9 11L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                    {isMobile && (
                        <button
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-tertiary)', fontSize: 20, lineHeight: 1 }}
                            onClick={closeMobile}
                            aria-label="Close menu"
                        >
                            ×
                        </button>
                    )}
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {!(collapsed && !isMobile) && <div className="sidebar-section-title">Main Menu</div>}
                    {navItems.map(({ href, icon, label }) => {
                        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`nav-item ${isActive ? 'active' : ''}`}
                                title={collapsed && !isMobile ? label : undefined}
                                onClick={closeMobile}
                            >
                                <span className="nav-icon">{icon}</span>
                                {!(collapsed && !isMobile) && <span style={{ flex: 1 }}>{label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer User Switcher */}
                <div className="sidebar-footer" style={{ cursor: 'pointer', transition: 'background var(--t-fast)', borderTop: '1px solid var(--border)' }} onClick={() => setCurrentUser(currentUser === 'Moksh' ? 'smit' : 'Moksh')} title="Click to switch identity">
                    <div className="avatar avatar-sm avatar-gradient-1" style={{ flexShrink: 0, background: currentUser === 'Moksh' ? 'var(--accent)' : 'var(--info)' }}>
                        {currentUser.charAt(0).toUpperCase()}
                    </div>
                    {!(collapsed && !isMobile) && (
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div className="sidebar-user-name" style={{ textTransform: 'uppercase' }}>{currentUser}</div>
                                <div className="sidebar-user-role">Founder</div>
                            </div>
                            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>⇄</div>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
