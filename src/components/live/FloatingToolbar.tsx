import React from 'react';
import {
  Play,
  Pause,
  Square,
  SquareDashed,
  Maximize2,
  Camera,
  Sparkles,
  ChevronDown,
  Square as StopIcon,
} from 'lucide-react';
import {
  IconButton,
  Slider,
  Tooltip,
  Menu,
  MenuItem,
  Button,
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
  } = useUiStore();

  const pipelineRunning = useDetectionStore((s) => s.pipelineRunning);

  const isLive = cameraStatus === 'connected' || (cameraMode === 'demo' && pipelineRunning);

  const handleStartWebcam = async () => {
    stopDetectionPipeline();
    setMode('webcam');
    await startWebcamAction();
  };

  const handleStartDemo = async () => {
    stopWebcamAction();
    setMode('demo');
    setStatus('connected');
    setFps(30);
    setLatency(33);
    await startDetectionPipeline();
  };

  const handleStop = () => {
    stopDetectionPipeline();
    stopWebcamAction();
  };

  const handlePause = () => {
    if (!isLive) return;
    setPaused(!paused);
  };

  const handleFullscreen = () => {
    window.dispatchEvent(new CustomEvent('visor:toggle-fullscreen'));
  };

  const sourceMenuItems: MenuItem[] = [
    {
      id: 'webcam',
      label: 'Webcam Stream',
      icon: <Camera className="w-3.5 h-3.5 text-text-2" />,
      onClick: handleStartWebcam,
    },
    {
      id: 'demo',
      label: 'Demo Scene',
      icon: <Sparkles className="w-3.5 h-3.5 text-accent" />,
      onClick: handleStartDemo,
    },
    ...(isLive
      ? [
          {
            id: 'stop',
            label: 'Stop Stream',
            icon: <StopIcon className="w-3.5 h-3.5 text-red" />,
            danger: true,
            onClick: handleStop,
          },
        ]
      : []),
  ];

  return (
    <div
      aria-label="Viewport Controls"
      className="h-toolbar bg-bg-2 border border-line-1 rounded-panel px-3 flex items-center justify-between gap-3 shadow-none select-none shrink-0"
    >
      {/* ITEM 1: Start ▾ Menu */}
      <div className="flex items-center shrink-0">
        <Menu
          align="left"
          items={sourceMenuItems}
          trigger={
            <Button
              variant={isLive ? 'secondary' : 'primary'}
              size={32}
              className="flex items-center gap-1.5 font-mono text-small"
            >
              {isLive ? (
                <>
                  <span className={`w-1.5 h-1.5 rounded-full ${paused ? 'bg-amber' : 'bg-accent-bright shadow-glow-accent'}`} />
                  <span>{cameraMode === 'webcam' ? 'Webcam' : 'Demo'}</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start</span>
                </>
              )}
              <ChevronDown className="w-3 h-3 text-text-3" />
            </Button>
          }
        />
      </div>

      {/* ITEM 2: Pause Toggle */}
      <div className="flex items-center shrink-0">
        <IconButton
          icon={paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          label={paused ? 'Resume Feed (Space)' : 'Pause Feed (Space)'}
          size={32}
          active={paused}
          activeVariant="steel"
          disabled={!isLive}
          onClick={handlePause}
        />
      </div>

      {/* ITEM 3: Boxes Toggle */}
      <div className="flex items-center shrink-0">
        <IconButton
          icon={showBoxes ? <Square className="w-4 h-4" /> : <SquareDashed className="w-4 h-4" />}
          label="Toggle Bounding Boxes (B)"
          size={32}
          active={showBoxes}
          activeVariant="accent"
          onClick={() => setShowBoxes(!showBoxes)}
        />
      </div>

      {/* ITEM 4: Compact Threshold Slider */}
      <div className="flex items-center shrink-0">
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

      {/* ITEM 5: Fullscreen Toggle */}
      <div className="flex items-center shrink-0">
        <IconButton
          icon={<Maximize2 className="w-4 h-4" />}
          label="Toggle Fullscreen (F)"
          size={32}
          onClick={handleFullscreen}
        />
      </div>
    </div>
  );
};
