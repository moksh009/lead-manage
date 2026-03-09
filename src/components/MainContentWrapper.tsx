"use client";

import { ReactNode } from 'react';
import { useSidebar } from './SidebarContext';

export default function MainContentWrapper({ children }: { children: ReactNode }) {
    const { collapsed, isMobile } = useSidebar();
    return (
        <main
            className="main-content"
            style={isMobile ? { marginLeft: 0, maxWidth: '100vw' } : {
                marginLeft: collapsed ? 64 : 'var(--sidebar-width)',
                transition: 'margin-left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                maxWidth: `calc(100vw - ${collapsed ? '64px' : 'var(--sidebar-width)'})`
            }}
        >
            {children}
        </main>
    );
}
