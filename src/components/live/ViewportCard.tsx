import React, { useEffect, useRef } from 'react';
import {
  CameraOff,
  Video,
  AlertTriangle,
  Lock,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useCameraStore } from '@/stores/cameraStore';
import { usePipelineStatus } from '@/stores/pipelineStatus';
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
    resolution,
    fps,
    latencyMs,
    mirror,
    paused,
    startWebcamAction,
    onVideoPlaying,
    stopWebcamAction,
    setMode,
    setStatus,
    setFps,
    setLatency,
  } = useCameraStore();

  const pipeline = usePipelineStatus();
  const pipelineRunning = useDetectionStore((s) => s.pipelineRunning);

  const isDemo = cameraMode === 'demo';
  const isLive = cameraStatus === 'connected' || (isDemo && pipelineRunning);

  // Attach MediaStream to <video> element
  useEffect(() => {
    if (videoRef.current && stream && !isDemo) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, isDemo]);

  // Bind canvas to SimulatedSceneSource when in demo mode
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

  // Clean up media tracks when unmounted
  useEffect(() => {
    return () => {
      stopWebcamAction();
    };
  }, [stopWebcamAction]);

  // rAF timer for HUD live clock
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
      className="relative flex-1 min-h-[360px] bg-bg-0 border border-line-1 rounded-panel overflow-hidden flex items-center justify-center select-none shadow-none"
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

      {/* 3. Minimalist HUD Overlay (Inset 12px) */}
      <div className="absolute inset-3 pointer-events-none flex flex-col justify-between z-20">
        {/* Top Row: Live/Paused status + Running Timecode */}
        <div className="flex items-center justify-between">
          {isLive ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-chip bg-hud-chip text-hud font-mono text-text-1 border border-line-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  paused ? 'bg-amber' : 'bg-red animate-pulse'
                }`}
              />
              <span>{paused ? 'PAUSED · CAM_01' : '● LIVE · CAM_01'}</span>
            </div>
          ) : (
            <div />
          )}

          <div className="px-2 py-0.5 rounded-chip bg-hud-chip text-hud font-mono text-text-2 border border-line-1">
            <span ref={clockRef}>00:00:00.00</span>
          </div>
        </div>

        {/* Bottom Row: Telemetry & Model badge */}
        <div className="flex items-center justify-between">
          {isLive ? (
            <div className="px-2 py-0.5 rounded-chip bg-hud-chip text-hud font-mono text-text-3 border border-line-1">
              <span>
                {resolution.width}×{resolution.height} · {fps.toFixed(1)} FPS · {latencyMs} MS
              </span>
            </div>
          ) : (
            <div />
          )}

          {isLive ? (
            <div className="px-2 py-0.5 rounded-chip bg-hud-chip text-hud font-mono border border-line-1">
              {pipeline.model === 'running' ? (
                pipeline.simulated ? (
                  <span className="text-amber">{pipeline.modelDisplay}</span>
                ) : (
                  <span className="text-accent">{pipeline.modelDisplay}</span>
                )
              ) : (
                <span className="text-text-3">NO MODEL</span>
              )}
            </div>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* 4. Minimalist Camera Offline State */}
      {!isLive && (
        <div className="relative z-10 flex flex-col items-center justify-center max-w-sm px-6 py-8 text-center bg-bg-2/95 border border-line-1 rounded-card mx-4 shadow-float">
          {cameraStatus === 'idle' && (
            <>
              <div className="w-10 h-10 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-text-2 mb-3">
                <Video className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-body-strong text-text-1 mb-1">Camera offline</h3>
              <p className="text-small text-text-2 mb-4 leading-relaxed">
                Connect your webcam or run the synthetic demo scene to stream visual frames.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size={32}
                  icon={<Video className="w-3.5 h-3.5" />}
                  onClick={startWebcamAction}
                >
                  Start Webcam
                </Button>
                <Button
                  variant="secondary"
                  size={32}
                  icon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
                  onClick={handleStartDemo}
                >
                  Run Demo Scene
                </Button>
              </div>
            </>
          )}

          {cameraStatus === 'requesting' && (
            <>
              <div className="w-10 h-10 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-text-2 mb-3">
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
              <div className="w-10 h-10 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-red mb-3">
                <Lock className="w-5 h-5 text-red" />
              </div>
              <h3 className="text-body-strong text-text-1 mb-1">Camera permission denied</h3>
              <p className="text-small text-text-2 mb-4 leading-relaxed">
                Camera access was blocked by your browser. You can still test with the demo scene.
              </p>
              <div className="flex items-center gap-2">
                <Button variant="primary" size={32} onClick={startWebcamAction}>
                  Try Again
                </Button>
                <Button variant="secondary" size={32} onClick={handleStartDemo}>
                  Run Demo Scene
                </Button>
              </div>
            </>
          )}

          {(cameraStatus === 'no_camera' || cameraStatus === 'in_use') && (
            <>
              <div className="w-10 h-10 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-amber mb-3">
                <CameraOff className="w-5 h-5 text-amber" />
              </div>
              <h3 className="text-body-strong text-text-1 mb-1">
                {cameraStatus === 'no_camera' ? 'No camera found' : 'Camera in use'}
              </h3>
              <p className="text-small text-text-2 mb-4 leading-relaxed">
                {cameraStatus === 'no_camera'
                  ? 'No video input devices detected on your system.'
                  : 'Another application is currently using the camera.'}
              </p>
              <Button variant="primary" size={32} onClick={handleStartDemo}>
                Run Demo Scene Instead
              </Button>
            </>
          )}

          {(cameraStatus === 'insecure_context' || cameraStatus === 'error') && (
            <>
              <div className="w-10 h-10 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-red mb-3">
                <AlertTriangle className="w-5 h-5 text-red" />
              </div>
              <h3 className="text-body-strong text-text-1 mb-1">Streaming error</h3>
              <p className="text-small text-text-2 mb-4 leading-relaxed">
                Unable to initialize local camera stream.
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
