import React from 'react';
import {
  Play,
  Pause,
  SquareDashed,
  Tag,
  Footprints,
  Camera,
  Maximize2,
  Square,
  Sparkles,
} from 'lucide-react';
import {
  IconButton,
  Slider,
  Tooltip,
} from '@/components/ui';
import { useCameraStore } from '@/stores/cameraStore';
import { useUiStore } from '@/stores/uiStore';
import { useDetectionStore } from '@/stores/detectionStore';
import {
  startDetectionPipeline,
  stopDetectionPipeline,
} from '@/lib/useDetectionPipeline';

export const FloatingToolbar: React.FC = () => {
  const {
    status: cameraStatus,
    mode: cameraMode,
    paused,
    setPaused,
    startWebcamAction,
    stopWebcamAction,
    setMode,
    setStatus,
    setFps,
    setLatency,
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

  const pipelineRunning = useDetectionStore((s) => s.pipelineRunning);
  const isDemo = cameraMode === 'demo';
  const isLive = cameraStatus === 'connected' || (isDemo && pipelineRunning);

  const handleStartStop = async () => {
    if (isLive) {
      stopDetectionPipeline();
      stopWebcamAction();
    } else {
      setMode('webcam');
      await startWebcamAction();
    }
  };

  const handleStartDemo = async () => {
    stopWebcamAction();
    setMode('demo');
    setStatus('connected');
    setFps(30);
    setLatency(33);
    await startDetectionPipeline();
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
    const canvas = document.querySelector('#viewport-card canvas') as HTMLCanvasElement | null;
    
    let sourceEl: HTMLVideoElement | HTMLCanvasElement | null = video;
    if (isDemo && canvas) sourceEl = canvas;
    if (!sourceEl) return;

    try {
      const snapCanvas = document.createElement('canvas');
      snapCanvas.width = (sourceEl as HTMLVideoElement).videoWidth || sourceEl.width || 1280;
      snapCanvas.height = (sourceEl as HTMLVideoElement).videoHeight || sourceEl.height || 720;
      const ctx = snapCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(sourceEl, 0, 0);
        const dataUrl = snapCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        const now = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').split('.')[0];
        link.download = `visor-snapshot-${now}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div className="h-toolbar flex items-center justify-center select-none shrink-0 w-full overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1 bg-bg-2 border border-line-2 rounded-card shadow-float max-w-full overflow-x-auto no-scrollbar">
        {/* GROUP 1: Start/Stop & Pause & Demo */}
        <div className="flex items-center gap-1 shrink-0">
          <IconButton
            icon={isLive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            label={isLive ? 'Stop Feed' : 'Start Webcam'}
            size={32}
            onClick={handleStartStop}
            className={isLive ? 'text-red hover:bg-bg-3' : 'text-accent hover:bg-bg-3'}
          />

          {!isLive && (
            <IconButton
              icon={<Sparkles className="w-3.5 h-3.5" />}
              label="Run Demo Scene"
              size={32}
              onClick={handleStartDemo}
              className="text-accent hover:bg-bg-3"
            />
          )}

          <IconButton
            icon={paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            label={paused ? 'Resume Feed (Space)' : 'Pause Feed (Space)'}
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

        {/* GROUP 3: Compact Threshold Slider */}
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

        {/* GROUP 4: Snapshot & Fullscreen */}
        <div className="flex items-center gap-1 shrink-0">
          {isLive && (
            <IconButton
              icon={<Camera className="w-3.5 h-3.5" />}
              label="Save Snapshot"
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
