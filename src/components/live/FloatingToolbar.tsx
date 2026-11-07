import React from 'react';
import {
  Play,
  Pause,
  Square,
  SquareDashed,
  Tag,
  Footprints,
  Camera,
  Maximize2,
} from 'lucide-react';
import {
  IconButton,
  SegmentedControl,
  Slider,
  Tooltip,
} from '@/components/ui';
import { useCameraStore } from '@/stores/cameraStore';
import { useUiStore } from '@/stores/uiStore';

export const FloatingToolbar: React.FC = () => {
  const {
    status: cameraStatus,
    paused,
    setPaused,
    setStatus,
    mode,
    setMode,
  } = useCameraStore();

  const {
    threshold,
    setThreshold,
    showBoxes,
    setShowBoxes,
    showLabels,
    setShowLabels,
    showTrails,
    setShowTrails,
  } = useUiStore();

  const isLive = cameraStatus === 'connected';

  const handleStartStop = () => {
    if (isLive) {
      setStatus('idle');
    } else {
      setStatus('connected');
    }
  };

  const handlePause = () => {
    if (!isLive) return;
    setPaused(!paused);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSnapshot = () => {
    window.alert('Snapshot export triggered (simulated in Phase 2).');
  };

  return (
    <div className="h-toolbar flex items-center justify-center select-none shrink-0 w-full overflow-hidden">
      <div className="flex items-center gap-2 px-2 py-1 bg-bg-2 border border-line-2 rounded-card shadow-float max-w-full overflow-x-auto no-scrollbar">
        {/* GROUP 1: Start/Stop & Pause */}
        <div className="flex items-center gap-1 shrink-0">
          <IconButton
            icon={isLive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            label={isLive ? 'Stop feed' : 'Start feed'}
            size={32}
            onClick={handleStartStop}
            className={isLive ? 'text-red hover:bg-bg-3' : 'text-accent hover:bg-bg-3'}
          />

          <IconButton
            icon={paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            label={paused ? 'Resume feed (Space)' : 'Pause feed (Space)'}
            size={32}
            disabled={!isLive}
            onClick={handlePause}
            className={paused ? 'bg-bg-4 text-amber' : ''}
          />
        </div>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-line-2 shrink-0" />

        {/* GROUP 2: Mode Segmented Control */}
        <div className="shrink-0">
          <SegmentedControl
            value={mode}
            onChange={(val) => setMode(val as 'webcam' | 'demo')}
            options={[
              { label: 'Webcam', value: 'webcam' },
              { label: 'Demo', value: 'demo' },
            ]}
          />
        </div>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-line-2 shrink-0" />

        {/* GROUP 3: Boxes, Labels, Trails Toggles */}
        <div className="flex items-center gap-1 shrink-0">
          <Tooltip content="Toggle Bounding Boxes (B)">
            <button
              type="button"
              onClick={() => setShowBoxes(!showBoxes)}
              aria-label="Toggle Bounding Boxes"
              className={`w-8 h-8 rounded-control flex items-center justify-center transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus ${
                showBoxes
                  ? 'bg-steel text-on-white'
                  : 'text-icon-dim hover:text-text-1 hover:bg-bg-3'
              }`}
            >
              <SquareDashed className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content="Toggle Labels (L)">
            <button
              type="button"
              onClick={() => setShowLabels(!showLabels)}
              aria-label="Toggle Labels"
              className={`w-8 h-8 rounded-control flex items-center justify-center transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus ${
                showLabels
                  ? 'bg-steel text-on-white'
                  : 'text-icon-dim hover:text-text-1 hover:bg-bg-3'
              }`}
            >
              <Tag className="w-4 h-4" />
            </button>
          </Tooltip>

          <Tooltip content="Toggle Motion Trails (T)">
            <button
              type="button"
              onClick={() => setShowTrails(!showTrails)}
              aria-label="Toggle Motion Trails"
              className={`w-8 h-8 rounded-control flex items-center justify-center transition-colors duration-fast focus-visible:outline-none focus-visible:shadow-focus ${
                showTrails
                  ? 'bg-steel text-on-white'
                  : 'text-icon-dim hover:text-text-1 hover:bg-bg-3'
              }`}
            >
              <Footprints className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-line-2 shrink-0" />

        {/* GROUP 4: Compact Threshold Slider (120px) */}
        <div className="flex items-center gap-2 shrink-0 pl-1">
          <Tooltip content={`Confidence threshold: ${(threshold * 100).toFixed(0)}%`}>
            <div className="w-[120px]">
              <Slider
                variant="compact"
                surface="card"
                min={0.3}
                max={0.95}
                step={0.05}
                value={threshold}
                onChange={setThreshold}
              />
            </div>
          </Tooltip>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-line-2 shrink-0" />

        {/* GROUP 5: Snapshot & Fullscreen */}
        <div className="flex items-center gap-1 shrink-0">
          <IconButton
            icon={<Camera className="w-3.5 h-3.5" />}
            label="Save Snapshot"
            size={32}
            onClick={handleSnapshot}
          />

          <IconButton
            icon={<Maximize2 className="w-3.5 h-3.5" />}
            label="Toggle Fullscreen (F)"
            size={32}
            onClick={handleFullscreen}
          />
        </div>
      </div>
    </div>
  );
};
