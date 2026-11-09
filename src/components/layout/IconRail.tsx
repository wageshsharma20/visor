import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Radio,
  Layers,
  Clock,
  Zap,
} from 'lucide-react';
import { Tooltip } from '@/components/ui';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    path: '/live',
    label: 'Live Monitor',
    icon: <Radio className="w-4 h-4" />,
    shortcut: 'g l',
  },
  {
    path: '/models',
    label: 'Model Registry',
    icon: <Layers className="w-4 h-4" />,
    shortcut: 'g m',
  },
  {
    path: '/history',
    label: 'Detection History',
    icon: <Clock className="w-4 h-4" />,
    shortcut: 'g h',
  },
];

export const IconRail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* DESKTOP RAIL (≥ 640px): 52px width on the left */}
      <aside className="hidden sm:flex flex-col items-center justify-between w-rail h-[calc(100dvh-56px)] bg-bg-1 border-r border-line-1 py-3 select-none z-sticky shrink-0">
        {/* Top: Logo Mark */}
        <div className="flex flex-col items-center gap-4">
          <div
            onClick={() => navigate('/live')}
            className="w-8 h-8 rounded-control bg-bg-2 border border-line-1 flex items-center justify-center text-text-1 hover:border-line-2 cursor-pointer transition-colors duration-fast"
            title="VISOR Live"
          >
            <Zap className="w-4 h-4 text-accent fill-accent/20" />
          </div>

          <div className="w-6 h-[1px] bg-line-1" />

          {/* Nav Items (3 items only) */}
          <nav className="flex flex-col items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Tooltip
                  key={item.path}
                  side="right"
                  content={
                    <div className="flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="text-text-3 font-mono">{item.shortcut}</span>
                      )}
                    </div>
                  }
                >
                  <button
                    type="button"
                    onClick={() => navigate(item.path)}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={`press relative w-8 h-8 rounded-control flex items-center justify-center focus-visible:outline-none focus-visible:shadow-focus ${
                      isActive
                        ? 'bg-bg-3 text-accent'
                        : 'text-icon-dim hover:text-text-1 hover:bg-bg-3'
                    }`}
                  >
                    {/* Active indicator: a short accent bar on the rail edge */}
                    <span
                      aria-hidden
                      className={`absolute -left-[10px] top-1.5 bottom-1.5 w-[2px] rounded-full bg-accent transition-[transform,opacity] duration-base ${
                        isActive ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'
                      }`}
                    />
                    {item.icon}
                  </button>
                </Tooltip>
              );
            })}
          </nav>
        </div>

        {/* Empty bottom space to balance layout */}
        <div />
      </aside>

      {/* MOBILE FLOATING NAV (< 640px): Centered bottom capsule */}
      <nav
        aria-label="Mobile Navigation"
        className="sm:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-sticky bg-bg-2 border border-line-2 rounded-card p-1 shadow-float flex items-center gap-1 select-none"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              className={`min-w-[40px] min-h-[40px] p-2.5 rounded-control flex items-center justify-center transition-all duration-fast focus-visible:outline-none focus-visible:shadow-focus ${
                isActive
                  ? 'bg-bg-3 text-accent'
                  : 'text-icon-dim hover:text-text-1 hover:bg-bg-3'
              }`}
            >
              {item.icon}
            </button>
          );
        })}
      </nav>
    </>
  );
};
