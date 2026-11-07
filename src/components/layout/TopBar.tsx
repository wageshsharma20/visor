import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Cloud,
  ChevronDown,
  Settings as SettingsIcon,
  PanelRight,
  User,
} from 'lucide-react';
import {
  IconButton,
  AvatarStack,
  StatusDot,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  Button,
} from '@/components/ui';
import { useCameraStore } from '@/stores/cameraStore';
import { useUiStore } from '@/stores/uiStore';
import { usePipelineStatus } from '@/stores/pipelineStatus';

const WORKSPACES = ['Lobby-North', 'Warehouse-East'] as const;

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { fps, latencyMs } = useCameraStore();
  const pipeline = usePipelineStatus();

  const {
    activeWorkspace,
    setActiveWorkspace,
    toggleDrawer,
    isDrawerOpen,
    isMembersOpen,
    setIsMembersOpen,
  } = useUiStore();

  const pageTitles: Record<string, string> = {
    '/live': 'Live Monitor',
    '/overview': 'Overview',
    '/models': 'Model Management',
    '/history': 'Detection History',
    '/analytics': 'Analytics',
    '/settings': 'Settings',
    '/__ui': 'UI Review Harness',
  };

  const currentTitle = pageTitles[location.pathname] || 'Live Monitor';

  const workspaceMenuItems: MenuItem[] = WORKSPACES.map((ws) => ({
    id: ws,
    label: ws,
    onClick: () => setActiveWorkspace(ws),
  }));

  const isModelAmber = pipeline.model === 'running' && pipeline.simulated;

  return (
    <header className="h-topbar bg-bg-1 border-b border-line-1 flex items-center px-4 justify-between select-none z-sticky shrink-0">
      {/* LEFT: VISOR Brand Text + Workspace switcher + Page Title (Duplicate logo mark removed) */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          onClick={() => navigate('/live')}
          className="cursor-pointer group shrink-0 py-1"
        >
          <span className="font-mono text-title text-text-1 tracking-tight group-hover:text-accent transition-colors duration-fast">
            VISOR
          </span>
        </div>

        <span className="text-small text-text-3 font-sans hidden md:inline shrink-0">
          / Visual Intelligence
        </span>

        <div className="h-4 w-[1px] bg-line-1 hidden sm:block shrink-0" />

        {/* Workspace Switcher via Menu component */}
        <div className="relative shrink-0">
          <Menu
            trigger={
              <button
                type="button"
                className="flex items-center gap-1.5 px-2 py-1 rounded-control bg-bg-2 border border-line-1 text-text-1 text-small hover:border-line-2 hover:bg-bg-3 transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus"
              >
                <span className="font-medium">{activeWorkspace}</span>
                <ChevronDown className="w-3.5 h-3.5 text-text-3" />
              </button>
            }
            items={workspaceMenuItems}
            align="left"
          />
        </div>

        <div className="h-4 w-[1px] bg-line-1 hidden lg:block shrink-0" />

        {/* Page Title & Cloud Status */}
        <div className="hidden lg:flex items-center gap-2 min-w-0">
          <span className="text-title text-text-1 font-semibold truncate">
            {currentTitle}
          </span>
          <Tooltip content="Edge sync active · frames processed locally">
            <div className="text-text-3 hover:text-text-2 cursor-help transition-colors duration-fast">
              <Cloud className="w-3.5 h-3.5" />
            </div>
          </Tooltip>
        </div>
      </div>

      {/* RIGHT: Source/Model/Camera Chips (via usePipelineStatus) + System Dot + Actions + Avatars */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Source Chip */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-chip bg-bg-2 border border-line-1 text-data font-mono">
          <span className="text-text-3">SRC:</span>
          {pipeline.source === 'none' ? (
            <span className="text-text-3">NO SOURCE</span>
          ) : (
            <span className="text-accent font-medium">{pipeline.sourceDisplay}</span>
          )}
        </div>

        {/* Model Chip: Amber if simulated per requirement */}
        <div
          onClick={() => navigate('/models')}
          className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-chip bg-bg-2 border border-line-1 text-data font-mono cursor-pointer hover:border-line-2 transition-colors duration-fast"
        >
          <StatusDot
            state={isModelAmber ? 'warning' : pipeline.model === 'running' ? 'live' : 'idle'}
          />
          <span
            className={
              isModelAmber
                ? 'text-amber font-medium'
                : pipeline.model === 'running'
                ? 'text-accent'
                : 'text-text-3'
            }
          >
            {pipeline.modelDisplay}
          </span>
        </div>

        {/* Camera Chip: Offline when off, resolution when live */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-chip bg-bg-2 border border-line-1 text-data font-mono">
          <StatusDot state={pipeline.camera === 'live' ? 'live' : 'idle'} />
          <span className={pipeline.camera === 'live' ? 'text-text-1' : 'text-text-3'}>
            {pipeline.cameraDisplay}
          </span>
        </div>

        {/* System Health Status Dot */}
        <Tooltip
          content={`System Health: ${fps} FPS · ${latencyMs}ms Latency · 0 Dropped`}
        >
          <div className="px-1.5 py-1 flex items-center justify-center cursor-help">
            <StatusDot state={fps > 0 ? 'live' : 'idle'} pulse={fps > 0} />
          </div>
        </Tooltip>

        {/* Drawer button (below 1024px) & Settings Capsule */}
        <div className="flex items-center gap-0.5 bg-bg-2 border border-line-1 rounded-control p-0.5">
          <div className="lg:hidden">
            <IconButton
              icon={<PanelRight className="w-4 h-4" />}
              label="Toggle Intelligence Panel"
              size={32}
              onClick={toggleDrawer}
              className={isDrawerOpen ? 'bg-bg-4 text-text-1' : ''}
            />
          </div>

          <IconButton
            icon={<SettingsIcon className="w-4 h-4" />}
            label="Settings"
            size={32}
            onClick={() => navigate('/settings')}
            className={location.pathname === '/settings' ? 'bg-bg-4 text-text-1' : ''}
          />
        </div>

        {/* Avatar Stack with Members Dialog */}
        <div
          onClick={() => setIsMembersOpen(true)}
          className="cursor-pointer hover:opacity-90 transition-opacity duration-fast"
        >
          <AvatarStack
            max={2}
            avatars={[
              { id: '1', name: 'Alex Chen', fallback: 'A' },
              { id: '2', name: 'Sarah Miller', fallback: 'S' },
              { id: '3', name: 'Antigravity Node', fallback: 'G' },
            ]}
          />
        </div>

        <Dialog
          open={isMembersOpen}
          onClose={() => setIsMembersOpen(false)}
          title="Workspace Members"
          description={`Active team members assigned to ${activeWorkspace}.`}
          footer={
            <Button
              variant="secondary"
              size={32}
              onClick={() => setIsMembersOpen(false)}
            >
              Close
            </Button>
          }
        >
          <div className="space-y-2 mt-2">
            {[
              { name: 'Alex Chen', role: 'Lead Architect', status: 'Online' },
              { name: 'Sarah Miller', role: 'Security Ops', status: 'In Mission' },
              { name: 'Antigravity Node', role: 'Edge AI Agent', status: 'Active' },
            ].map((m) => (
              <div
                key={m.name}
                className="flex items-center justify-between p-2 rounded-control bg-bg-3 border border-line-1"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-bg-4 border border-line-2 flex items-center justify-center text-text-2">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-body font-medium text-text-1">{m.name}</div>
                    <div className="text-small text-text-3">{m.role}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-data font-mono text-accent">
                  <StatusDot state="live" />
                  <span>{m.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Dialog>
      </div>
    </header>
  );
};
