import React from 'react';
import { useLocation } from 'react-router-dom';
import {
  Settings as SettingsIcon,
} from 'lucide-react';
import {
  IconButton,
  Pill,
  Tooltip,
} from '@/components/ui';
import { useCameraStore } from '@/stores/cameraStore';
import { useUiStore } from '@/stores/uiStore';
import { usePipelineStatus } from '@/stores/pipelineStatus';

export const TopBar: React.FC = () => {
  const location = useLocation();

  const { fps, latencyMs, resolution } = useCameraStore();
  const pipeline = usePipelineStatus();
  const { setSettingsOpen } = useUiStore();

  const pageTitles: Record<string, string> = {
    '/live': 'Live Monitor',
    '/models': 'Models',
    '/history': 'History',
    '/__ui': 'UI Review Harness',
  };

  const currentTitle = pageTitles[location.pathname] || 'Live Monitor';

  // Progressive disclosure: Status pill is hidden while no source is running (DESIGN.md §5.1)
  const isStreaming = pipeline.source !== 'none' || pipeline.camera === 'live' || pipeline.camera === 'requesting';

  // Popover details for hover/focus
  const popoverContent = (
    <div className="flex flex-col gap-1.5 p-1 text-data font-mono text-left select-none">
      <div className="flex items-center justify-between gap-4">
        <span className="text-text-3">SOURCE</span>
        <span className="text-text-1 font-medium">{pipeline.sourceDisplay}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-text-3">CAMERA</span>
        <span className="text-text-1">
          {pipeline.camera === 'live'
            ? `${resolution.width}×${resolution.height} · ${fps} FPS`
            : pipeline.cameraDisplay}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-text-3">MODEL</span>
        <span className={pipeline.simulated ? 'text-amber' : 'text-accent'}>
          {pipeline.modelDisplay}
        </span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-text-3">LATENCY</span>
        <span className="text-text-2">{latencyMs} ms</span>
      </div>
    </div>
  );

  return (
    <header className="h-topbar bg-bg-1 border-b border-line-1 flex items-center px-4 justify-between select-none z-sticky shrink-0">
      {/* LEFT: Page title only ("Live Monitor", "Models", "History") */}
      <div className="flex items-center min-w-0">
        <span className="text-title text-text-1 font-semibold truncate">
          {currentTitle}
        </span>
      </div>

      {/* RIGHT: ONE status pill (when streaming) + settings gear */}
      <div className="flex items-center gap-2.5 shrink-0">
        {isStreaming && (
          <Tooltip content={popoverContent} side="bottom">
            <button
              type="button"
              className="focus-visible:outline-none focus-visible:shadow-focus rounded-full cursor-help"
            >
              <Pill
                variant={pipeline.simulated ? 'simulated' : 'visible'}
                dot
                pulse={pipeline.camera === 'live'}
              >
                ● LIVE · CAM_01 · {pipeline.modelDisplay}
              </Pill>
            </button>
          </Tooltip>
        )}

        <IconButton
          icon={<SettingsIcon className="w-4 h-4" />}
          label="Settings"
          size={32}
          onClick={() => setSettingsOpen(true)}
        />
      </div>
    </header>
  );
};
