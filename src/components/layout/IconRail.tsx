import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Radio,
  LayoutDashboard,
  Layers,
  Clock,
  BarChart2,
  Settings as SettingsIcon,
  LogOut,
  Zap,
} from 'lucide-react';
import { Tooltip, Dialog, Button } from '@/components/ui';

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
    path: '/overview',
    label: 'Overview',
    icon: <LayoutDashboard className="w-4 h-4" />,
    shortcut: 'g o',
  },
  {
    path: '/models',
    label: 'Model Management',
    icon: <Layers className="w-4 h-4" />,
    shortcut: 'g m',
  },
  {
    path: '/history',
    label: 'Detection History',
    icon: <Clock className="w-4 h-4" />,
    shortcut: 'g h',
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: <BarChart2 className="w-4 h-4" />,
    shortcut: 'g a',
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: <SettingsIcon className="w-4 h-4" />,
  },
];

export const IconRail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [exitDialogOpen, setExitDialogOpen] = useState(false);

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

          {/* Nav Items */}
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
                    className={`w-8 h-8 rounded-control flex items-center justify-center transition-all duration-fast focus-visible:outline-none focus-visible:shadow-focus ${
                      isActive
                        ? 'bg-accent text-on-accent shadow-glow-accent'
                        : 'text-icon-dim hover:text-text-1 hover:bg-bg-3'
                    }`}
                  >
                    {item.icon}
                  </button>
                </Tooltip>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Exit action */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-[1px] bg-line-1" />
          <Tooltip side="right" content="Exit Session">
            <button
              type="button"
              onClick={() => setExitDialogOpen(true)}
              aria-label="Exit Session"
              className="w-8 h-8 rounded-control flex items-center justify-center text-icon-dim hover:text-red hover:bg-bg-3 transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
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
                  ? 'bg-accent text-on-accent shadow-glow-accent'
                  : 'text-icon-dim hover:text-text-1 hover:bg-bg-3'
              }`}
            >
              {item.icon}
            </button>
          );
        })}
      </nav>

      {/* Exit confirmation dialog */}
      <Dialog
        open={exitDialogOpen}
        onClose={() => setExitDialogOpen(false)}
        title="Exit VISOR Session"
        description="Are you sure you want to disconnect from the active telemetry stream?"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size={32} onClick={() => setExitDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size={32}
              onClick={() => {
                setExitDialogOpen(false);
                navigate('/live');
              }}
            >
              Disconnect
            </Button>
          </div>
        }
      >
        <div className="text-small text-text-3">
          Your telemetry stream will be unmounted and local state will be kept intact.
        </div>
      </Dialog>
    </>
  );
};
