import React, { useEffect, useRef } from 'react';
import { CameraOff, Play, Video } from 'lucide-react';
import { Button } from '@/components/ui';
import { useCameraStore } from '@/stores/cameraStore';
import { useModelStore } from '@/stores/modelStore';

export const ViewportCard: React.FC = () => {
  const clockRef = useRef<HTMLSpanElement | null>(null);
  const { status: cameraStatus, mode, resolution, setStatus, setMode } = useCameraStore();
  const { sourceLabel, setSourceLabel } = useModelStore();

  // rAF timer for HUD clock (SPEC.md §6.3: updated by rAF writing to ref without React state)
  useEffect(() => {
    let animId: number;
    const updateClock = () => {
      if (clockRef.current) {
        const d = new Date();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        const ms = String(Math.floor(d.getMilliseconds() / 10)).padStart(2, '0');
        clockRef.current.textContent = `${hh}:${mm}:${ss}.${ms}`;
      }
      animId = requestAnimationFrame(updateClock);
    };
    animId = requestAnimationFrame(updateClock);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleStartWebcam = () => {
    setMode('webcam');
    setStatus('connected');
    setSourceLabel('WEBCAM');
  };

  const handleRunDemo = () => {
    setMode('demo');
    setStatus('connected');
    setSourceLabel('SIMULATED');
  };

  return (
    <div className="relative flex-1 min-h-[320px] bg-bg-0 border border-line-1 rounded-panel overflow-hidden flex items-center justify-center select-none shadow-none">
      {/* 1. Static Viewfinder Corner Brackets (16px L marks, 25% opacity, 1.5px stroke) */}
      <div className="absolute inset-4 pointer-events-none z-10">
        {/* Top-Left */}
        <svg className="absolute top-0 left-0 w-4 h-4 text-text-1 opacity-25" viewBox="0 0 16 16">
          <path d="M 0 16 L 0 0 L 16 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {/* Top-Right */}
        <svg className="absolute top-0 right-0 w-4 h-4 text-text-1 opacity-25" viewBox="0 0 16 16">
          <path d="M 16 16 L 16 0 L 0 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {/* Bottom-Left */}
        <svg className="absolute bottom-0 left-0 w-4 h-4 text-text-1 opacity-25" viewBox="0 0 16 16">
          <path d="M 0 0 L 0 16 L 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        {/* Bottom-Right */}
        <svg className="absolute bottom-0 right-0 w-4 h-4 text-text-1 opacity-25" viewBox="0 0 16 16">
          <path d="M 16 0 L 16 16 L 0 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* 2. HUD Chips (Inset 12px) */}
      <div className="absolute inset-3 pointer-events-none flex flex-col justify-between z-20">
        {/* Top Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-chip bg-hud-chip text-hud font-mono text-text-1 border border-line-1">
            <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
            <span>REC · CAM_01</span>
          </div>

          <div className="px-2 py-0.5 rounded-chip bg-hud-chip text-hud font-mono text-text-2 border border-line-1">
            <span ref={clockRef}>00:00:00.00</span>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between">
          <div className="px-2 py-0.5 rounded-chip bg-hud-chip text-hud font-mono text-text-3 border border-line-1">
            <span>{resolution.width}×{resolution.height} · 0.0 FPS · 0 MS</span>
          </div>

          <div className="px-2 py-0.5 rounded-chip bg-hud-chip text-hud font-mono border border-line-1">
            {sourceLabel === 'SIMULATED' ? (
              <span className="text-amber">SIMULATED · DEMO SCENE</span>
            ) : sourceLabel === 'WEBCAM' ? (
              <span className="text-accent">LIVE FEED · WEBCAM</span>
            ) : (
              <span className="text-text-3">NO MODEL</span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Centered Viewport State: "Camera offline" */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-sm px-6 py-8 text-center bg-bg-2/80 border border-line-1 rounded-card mx-4">
        <div className="w-9 h-9 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-text-2 mb-3">
          <CameraOff className="w-5 h-5 text-text-3" />
        </div>

        <h3 className="text-body-strong text-text-1 mb-1">
          {cameraStatus === 'connected' ? 'Feed Paused / Ready' : 'Camera offline'}
        </h3>

        <p className="text-small text-text-2 mb-4 leading-relaxed">
          {cameraStatus === 'connected'
            ? `Active mode: ${mode}. Live frame detection ingestion will activate in Phase 3/4.`
            : 'Connect a camera or start the synthetic demo scene to view real-time detections.'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 w-full">
          <Button
            variant="primary"
            size={32}
            icon={<Video className="w-3.5 h-3.5" />}
            onClick={handleStartWebcam}
          >
            Start webcam
          </Button>

          <Button
            variant="secondary"
            size={32}
            icon={<Play className="w-3.5 h-3.5" />}
            onClick={handleRunDemo}
          >
            Run demo scene
          </Button>
        </div>
      </div>

      {/* Subtle vignette on video frame background */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]" />
    </div>
  );
};
