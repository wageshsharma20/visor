import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Zap,
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
import { useModelStore } from '@/stores/modelStore';
import { useUiStore } from '@/stores/uiStore';

const WORKSPACES = ['Lobby-North', 'Warehouse-East'] as const;

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { status: cameraStatus, fps, latencyMs } = useCameraStore();
  const { activeModel, sourceLabel } = useModelStore();
  const {
    activeWorkspace,
    setActiveWorkspace,
    toggleDrawer,
    isDrawerOpen,
    isMembersOpen,
    setIsMembersOpen,
  } = useUiStore();

  // Route title mapping
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

  const isCameraLive = cameraStatus === 'connected';
  const cameraText = isCameraLive ? 'CAM_01 · LIVE' : 'CAM_01 · OFF';
  const cameraDotState = isCameraLive ? 'live' : 'idle';

  const modelText = activeModel ? `${activeModel.name} · RUNNING` : 'NO MODEL';
  const modelDotState = activeModel ? 'live' : 'idle';

  const workspaceMenuItems: MenuItem[] = WORKSPACES.map((ws) => ({
    id: ws,
    label: ws,
    onClick: () => setActiveWorkspace(ws),
  }));

  return (
    <header className="h-topbar bg-bg-1 border-b border-line-1 flex items-center px-4 justify-between select-none z-sticky shrink-0">
      {/* LEFT: Logo + Product Name + Workspace switcher + Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          onClick={() => navigate('/live')}
          className="flex items-center gap-2 cursor-pointer group shrink-0"
        >
          <div className="w-7 h-7 rounded-control bg-bg-2 border border-line-1 flex items-center justify-center text-accent group-hover:border-line-2 transition-colors duration-fast">
            <Zap className="w-4 h-4 fill-accent/20" />
          </div>
          <span className="font-mono text-title text-text-1 tracking-tight">VISOR</span>
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

      {/* RIGHT: Source/Model/Camera Chips + System Dot + Actions + Avatars */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* Source Chip */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-chip bg-bg-2 border border-line-1 text-data font-mono">
          <span className="text-text-3">SRC:</span>
          {sourceLabel === 'SIMULATED' ? (
            <span className="text-amber font-medium">SIMULATED</span>
          ) : (
            <span className="text-text-3">{sourceLabel}</span>
          )}
        </div>

        {/* Model Chip */}
        <div
          onClick={() => navigate('/models')}
          className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-chip bg-bg-2 border border-line-1 text-data font-mono cursor-pointer hover:border-line-2 transition-colors duration-fast"
        >
          <StatusDot state={modelDotState} />
          <span className={activeModel ? 'text-text-1' : 'text-text-3'}>
            {modelText}
          </span>
        </div>

        {/* Camera Chip */}
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-chip bg-bg-2 border border-line-1 text-data font-mono">
          <StatusDot state={cameraDotState} />
          <span className={isCameraLive ? 'text-text-1' : 'text-text-3'}>
            {cameraText}
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
          {/* Below 1024px intel drawer trigger */}
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
