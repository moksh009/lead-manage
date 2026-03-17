"use client";

import { ReactNode } from 'react';
import { useSidebar } from './SidebarContext';
import NotificationBell from './NotificationBell';

export default function MainContentWrapper({ children, className }: { children: ReactNode; className?: string }) {
    const { collapsed, isMobile } = useSidebar();
    return (
        <main
            className={`main-content${className ? ' ' + className : ''}`}
            style={isMobile ? { marginLeft: 0, maxWidth: '100vw' } : {
                marginLeft: collapsed ? 64 : 'var(--sidebar-width)',
                transition: 'margin-left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                maxWidth: `calc(100vw - ${collapsed ? '64px' : 'var(--sidebar-width)'})`
            }}
        >
            <div className="glow-background">
                <div className="glow-blob glow-blob-1 animate-float" />
                <div className="glow-blob glow-blob-2 animate-float" style={{ animationDelay: '-3s' }} />
            </div>
            <NotificationBell />
            {children}
        </main>
    );
}

