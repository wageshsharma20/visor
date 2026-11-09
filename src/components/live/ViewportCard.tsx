import { DetectionOverlay } from './DetectionOverlay';
import React, { useEffect, useRef } from 'react';
import {
  CameraOff,
  AlertTriangle,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useCameraStore } from '@/stores/cameraStore';
import { useDetectionStore } from '@/stores/detectionStore';
import {
  globalSimulatedSource,
  startDetectionPipeline,
} from '@/lib/useDetectionPipeline';

export const ViewportCard: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const clockRef = useRef<HTMLSpanElement | null>(null);

  const {
    status: cameraStatus,
    mode: cameraMode,
    stream,
    mirror,
    resolution,
    paused,
    startWebcamAction,
    onVideoPlaying,
    setMode,
    setStatus,
    setFps,
    setLatency,
  } = useCameraStore();

  const pipelineRunning = useDetectionStore((s) => s.pipelineRunning);

  const isDemo = cameraMode === 'demo';
  const isLive = cameraStatus === 'connected' || (isDemo && pipelineRunning);

  // Attach MediaStream to <video> element if webcam
  useEffect(() => {
    if (videoRef.current && stream && !isDemo) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, isDemo]);

  // Attach canvas to simulatedSceneSource if demo
  useEffect(() => {
    if (isDemo && canvasRef.current) {
      canvasRef.current.width = 1280;
      canvasRef.current.height = 720;
      globalSimulatedSource.bindCanvas(canvasRef.current);
    }
    return () => {
      globalSimulatedSource.bindCanvas(null);
    };
  }, [isDemo]);

  // rAF timer for HUD live clock
  useEffect(() => {
    let animId: number;
    const updateClock = () => {
      if (clockRef.current) {
        const d = new Date();
        const pad = (n: number, w = 2) => String(n).padStart(w, '0');
        const ms = Math.floor(d.getMilliseconds() / 10);
        clockRef.current.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(ms, 2)}`;
      }
      animId = requestAnimationFrame(updateClock);
    };

    animId = requestAnimationFrame(updateClock);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Fullscreen support
  useEffect(() => {
    const handleToggleFullscreen = () => {
      if (!containerRef.current) return;
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    };

    window.addEventListener('visor:toggle-fullscreen', handleToggleFullscreen);
    return () => {
      window.removeEventListener('visor:toggle-fullscreen', handleToggleFullscreen);
    };
  }, []);

  const handleStartDemo = async () => {
    setMode('demo');
    setStatus('connected');
    setFps(30);
    setLatency(33);
    await startDetectionPipeline();
  };

  return (
    <div
      ref={containerRef}
      id="viewport-card"
      className="relative flex-1 min-h-[320px] bg-bg-0 border border-line-1 rounded-panel overflow-hidden flex items-center justify-center select-none shadow-none"
    >
      {/* 1. Real Webcam Video Layer (Letterboxed) */}
      {!isDemo && stream && (
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          onPlaying={(e) => onVideoPlaying(e.currentTarget)}
          className={`absolute inset-0 w-full h-full object-contain ${
            mirror ? 'scale-x-[-1]' : ''
          }`}
        />
      )}

      {/* 2. Synthetic Demo Canvas (Letterboxed) */}
      {isDemo && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain bg-bg-0"
        />
      )}

      {/* Detection boxes */}
      {isLive && (
        <DetectionOverlay
          sourceWidth={isDemo ? 1280 : resolution.width || 1280}
          sourceHeight={isDemo ? 720 : resolution.height || 720}
          mirrored={cameraMode === 'webcam' && mirror}
        />
      )}

      {/* 3. HUD Overlay: Only "● LIVE · CAM_01" top-left (or PAUSED) and time top-right */}
      <div className="absolute inset-3 pointer-events-none flex flex-col justify-between z-20">
        <div className="flex items-center justify-between w-full">
          {isLive ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-chip bg-hud-chip text-hud font-mono text-text-1 border border-line-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  paused ? 'bg-amber' : 'bg-red animate-pulse'
                }`}
              />
              <span>{paused ? 'PAUSED · CAM_01' : 'LIVE · CAM_01'}</span>
            </div>
          ) : (
            <div />
          )}

          <div className="px-2 py-0.5 rounded-chip bg-hud-chip text-hud font-mono text-text-2 border border-line-1">
            <span ref={clockRef}>00:00:00.00</span>
          </div>
        </div>
      </div>

      {/* 4. Real Error States (if camera fails or is denied) */}
      {!isLive && cameraStatus !== 'idle' && (
        <div className="relative z-10 flex flex-col items-center justify-center max-w-sm px-6 py-8 text-center bg-bg-2/90 border border-line-1 rounded-card mx-4 shadow-float">
          {cameraStatus === 'requesting' && (
            <>
              <div className="w-9 h-9 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-text-2 mb-3">
                <RefreshCw className="w-5 h-5 text-accent animate-spin" />
              </div>
              <h3 className="text-body-strong text-text-1 mb-1">Requesting camera access</h3>
              <p className="text-small text-text-2 leading-relaxed">
                Please grant camera permissions in your browser prompt.
              </p>
            </>
          )}

          {cameraStatus === 'denied' && (
            <>
              <div className="w-9 h-9 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-red mb-3">
                <Lock className="w-5 h-5 text-red" />
              </div>
              <h3 className="text-body-strong text-text-1 mb-1">Camera permission denied</h3>
              <p className="text-small text-text-2 mb-4 leading-relaxed">
                Allow camera access in your browser site settings or try the synthetic demo scene.
              </p>
              <div className="flex items-center gap-2">
                <Button variant="primary" size={32} onClick={startWebcamAction}>
                  Try Again
                </Button>
                <Button variant="secondary" size={32} onClick={handleStartDemo}>
                  Try Demo Scene
                </Button>
              </div>
            </>
          )}

          {(cameraStatus === 'no_camera' || cameraStatus === 'in_use') && (
            <>
              <div className="w-9 h-9 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-amber mb-3">
                <CameraOff className="w-5 h-5 text-amber" />
              </div>
              <h3 className="text-body-strong text-text-1 mb-1">
                {cameraStatus === 'no_camera' ? 'No camera found' : 'Camera in use'}
              </h3>
              <p className="text-small text-text-2 mb-4 leading-relaxed">
                {cameraStatus === 'no_camera'
                  ? 'No video input devices were detected on your system.'
                  : 'Another application is currently using the camera.'}
              </p>
              <Button variant="primary" size={32} onClick={handleStartDemo}>
                Run Demo Scene Instead
              </Button>
            </>
          )}

          {(cameraStatus === 'insecure_context' || cameraStatus === 'error') && (
            <>
              <div className="w-9 h-9 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-red mb-3">
                <AlertTriangle className="w-5 h-5 text-red" />
              </div>
              <h3 className="text-body-strong text-text-1 mb-1">Streaming error</h3>
              <p className="text-small text-text-2 mb-4 leading-relaxed">
                Unable to initialize camera feed on this device.
              </p>
              <Button variant="secondary" size={32} onClick={handleStartDemo}>
                Run Demo Scene
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
