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
    startWebcamAction,
    stopWebcamAction,
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
      stopWebcamAction();
    } else {
      startWebcamAction();
    }
  };

  const handlePause = () => {
    if (!isLive) return;
    setPaused(!paused);
  };

  const handleFullscreen = () => {
    window.dispatchEvent(new CustomEvent('visor:toggle-fullscreen'));
  };

  const handleSnapshot = () => {
    const video = document.querySelector('video');
    if (!video || video.videoWidth === 0) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const now = new Date()
          .toISOString()
          .replace(/[-:]/g, '')
          .replace('T', '-')
          .split('.')[0];
        link.download = `visor-snapshot-${now}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch {
      // In case of security/tainted canvas issues
    }
  };

  return (
    <div className="h-toolbar flex items-center justify-center select-none shrink-0 w-full overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-1 bg-bg-2 border border-line-2 rounded-card shadow-float max-w-full overflow-x-auto no-scrollbar">
        {/* GROUP 1: Start/Stop & Pause */}
        <div className="flex items-center gap-1 shrink-0">
          <IconButton
            icon={isLive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            label={isLive ? 'Stop feed' : 'Start webcam'}
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

        {/* GROUP 2: Overlays Toggles (Boxes, Labels, Trails) */}
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

        {/* GROUP 3: Compact Threshold Slider (track 120px + 8px gap + 36px readout = 164px) */}
        <div className="flex items-center gap-2 shrink-0">
          <Tooltip content={`Confidence threshold: ${(threshold * 100).toFixed(0)}%`}>
            <Slider
              variant="compact"
              surface="card"
              min={0.3}
              max={0.95}
              step={0.05}
              value={threshold}
              onChange={setThreshold}
            />
          </Tooltip>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-4 bg-line-2 shrink-0" />

        {/* GROUP 4: Snapshot (hidden until live) & Fullscreen */}
        <div className="flex items-center gap-1 shrink-0">
          {isLive && (
            <IconButton
              icon={<Camera className="w-3.5 h-3.5" />}
              label="Save Snapshot PNG"
              size={32}
              onClick={handleSnapshot}
            />
          )}

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
