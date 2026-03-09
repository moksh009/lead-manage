"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
    { href: '/', icon: '⊞', label: 'Dashboard' },
    { href: '/outreach', icon: '📊', label: 'Daily Outreach Log' },
    { href: '/leads', icon: '🎯', label: 'Cold Calling Leads' },
    { href: '/pipeline', icon: '🔄', label: 'Pipeline Board' },
    { href: '/clients', icon: '💼', label: 'Clients & Billing' },
    { href: '/team-goals', icon: '🏆', label: 'Team Goals' },
    { href: '/analytics', icon: '📈', label: 'Analytics' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            {/* Logo */}
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9" />
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </div>
                <div>
                    <div className="sidebar-logo-text">Top Edge AI</div>
                    <div className="sidebar-logo-sub">Lead Management</div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <div className="sidebar-section-title">Main Menu</div>
                {navItems.map(({ href, icon, label }) => {
                    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <span className="nav-icon">{icon}</span>
                            <span style={{ flex: 1 }}>{label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <div className="avatar avatar-sm avatar-gradient-1">T</div>
                <div style={{ flex: 1 }}>
                    <div className="sidebar-user-name">Top Edge AI</div>
                    <div className="sidebar-user-role">Admin Panel</div>
                </div>
            </div>
        </aside>
    );
}
