import React from 'react';
import { useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { IconRail } from './IconRail';
import { useKeyboardNav } from '@/lib/useKeyboardNav';

export interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  useKeyboardNav();
  const location = useLocation();
  const isLivePage = location.pathname === '/live';

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-bg-1 text-text-1 overflow-hidden select-none">
      {/* Top Bar (56px) */}
      <TopBar />

      {/* Main Body: Icon Rail (52px) + Content Canvas */}
      <div className="flex flex-1 min-h-0 w-full overflow-hidden relative">
        <IconRail />

        {/* Canvas Area: dot-grid background, 20px padding */}
        <main
          className={`flex-1 min-w-0 bg-canvas bg-bg-1 p-3 sm:p-canvas relative ${
            isLivePage ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
