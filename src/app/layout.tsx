import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { SidebarProvider } from '@/components/SidebarContext';
import { UserProvider } from '@/components/UserContext';
import MainContentWrapper from '@/components/MainContentWrapper';

export const metadata: Metadata = {
  title: 'TopEdge AI — Lead Management',
  description: 'Premium Lead Management Software for Top Edge AI',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <UserProvider>
          <SidebarProvider>
            <div className="app-layout">
              <Sidebar />
              <MainContentWrapper>
                {children}
              </MainContentWrapper>
            </div>
          </SidebarProvider>
        </UserProvider>
      </body>
    </html>
  );
}
