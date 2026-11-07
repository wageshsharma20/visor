import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CameraOff,
  Video,
  AlertTriangle,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useCameraStore } from '@/stores/cameraStore';
import { usePipelineStatus } from '@/stores/pipelineStatus';

export const ViewportCard: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const clockRef = useRef<HTMLSpanElement | null>(null);

  const {
    status: cameraStatus,
    stream,
    resolution,
    fps,
    latencyMs,
    mirror,
    startWebcamAction,
    onVideoPlaying,
    stopWebcamAction,
  } = useCameraStore();

  const pipeline = usePipelineStatus();

  // Attach MediaStream to <video> element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  // Clean up media tracks when ViewportCard unmounts
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

  // Expose toggle fullscreen helper on the viewport card container
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

  const isLive = cameraStatus === 'connected';

  return (
    <div
      ref={containerRef}
      id="viewport-card"
      className="relative flex-1 min-h-[320px] bg-bg-0 border border-line-1 rounded-panel overflow-hidden flex items-center justify-center select-none shadow-none"
    >
      {/* 1. Real Webcam Video Layer (Letterboxed) */}
      {stream && (
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

      {/* 2. Static Viewfinder Corner Brackets (16px L marks, 25% opacity, 1.5px stroke) */}
      <div className="absolute inset-4 pointer-events-none z-10">
        <svg className="absolute top-0 left-0 w-4 h-4 text-text-1 opacity-25" viewBox="0 0 16 16">
          <path d="M 0 16 L 0 0 L 16 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <svg className="absolute top-0 right-0 w-4 h-4 text-text-1 opacity-25" viewBox="0 0 16 16">
          <path d="M 16 16 L 16 0 L 0 0" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <svg className="absolute bottom-0 left-0 w-4 h-4 text-text-1 opacity-25" viewBox="0 0 16 16">
          <path d="M 0 0 L 0 16 L 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <svg className="absolute bottom-0 right-0 w-4 h-4 text-text-1 opacity-25" viewBox="0 0 16 16">
          <path d="M 16 0 L 16 16 L 0 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {/* 3. HUD Overlay (Inset 12px) - REC, FPS and model chips only appear when camera is live */}
      <div className="absolute inset-3 pointer-events-none flex flex-col justify-between z-20">
        {/* Top Row */}
        <div className="flex items-center justify-between">
          {/* Show REC dot ONLY while streaming */}
          {isLive ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-chip bg-hud-chip text-hud font-mono text-text-1 border border-line-1">
              <span className="w-2 h-2 rounded-full bg-red animate-pulse" />
              <span>REC · CAM_01</span>
            </div>
          ) : (
            <div />
          )}

          {/* Clock is always visible */}
          <div className="px-2 py-0.5 rounded-chip bg-hud-chip text-hud font-mono text-text-2 border border-line-1">
            <span ref={clockRef}>00:00:00.00</span>
          </div>
        </div>

        {/* Bottom Row: Resolution & Model chip only visible while streaming */}
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

      {/* 4. Real DESIGN §6.6 Viewport States */}
      {!isLive && (
        <div className="relative z-10 flex flex-col items-center justify-center max-w-sm px-6 py-8 text-center bg-bg-2/90 border border-line-1 rounded-card mx-4 shadow-float">
          {/* STATE A: IDLE */}
          {cameraStatus === 'idle' && (
            <>
              <div className="w-9 h-9 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-text-2 mb-3">
                <Video className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-body-strong text-text-1 mb-1">Camera offline</h3>
              <p className="text-small text-text-2 mb-4 leading-relaxed">
                Connect your webcam to stream real-time visual frames into VISOR.
              </p>
              <Button
                variant="primary"
                size={32}
                icon={<Video className="w-3.5 h-3.5" />}
                onClick={startWebcamAction}
              >
                Start webcam
              </Button>
            </>
          )}

          {/* STATE B: REQUESTING PERMISSION */}
          {cameraStatus === 'requesting' && (
            <>
              <div className="w-9 h-9 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-text-2 mb-3">
                <RefreshCw className="w-5 h-5 text-accent animate-spin" />
              </div>
              <h3 className="text-body-strong text-text-1 mb-1">Waiting for camera permission…</h3>
              <p className="text-small text-text-2 leading-relaxed">
                Approve the camera access prompt in your browser to begin ingestion.
              </p>
            </>
          )}

          {/* STATE C: DENIED */}
          {cameraStatus === 'denied' && (
            <>
              <div className="w-9 h-9 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-amber mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-body-strong text-text-1 mb-1">Camera blocked</h3>
              <p className="text-small text-text-2 mb-4 leading-relaxed">
                Permission was denied. Click the lock or camera icon in your browser URL bar to allow access.
              </p>
              <Button
                variant="secondary"
                size={32}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={startWebcamAction}
              >
                Try again
              </Button>
            </>
          )}

          {/* STATE D: IN USE */}
          {cameraStatus === 'in_use' && (
            <>
              <div className="w-9 h-9 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-amber mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-body-strong text-text-1 mb-1">Camera in use</h3>
              <p className="text-small text-text-2 mb-4 leading-relaxed">
                Your webcam is currently claimed by another application or browser tab.
              </p>
              <Button
                variant="secondary"
                size={32}
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={startWebcamAction}
              >
                Try again
              </Button>
            </>
          )}

          {/* STATE E: NO CAMERA */}
          {cameraStatus === 'no_camera' && (
            <>
              <div className="w-9 h-9 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-text-3 mb-3">
                <CameraOff className="w-5 h-5" />
              </div>
              <h3 className="text-body-strong text-text-1 mb-1">No camera found</h3>
              <p className="text-small text-text-2 leading-relaxed">
                No video input devices were detected on this system.
              </p>
            </>
          )}

          {/* STATE F: INSECURE CONTEXT / GENERIC ERROR */}
          {(cameraStatus === 'insecure_context' || cameraStatus === 'error') && (
            <>
              <div className="w-9 h-9 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-red mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-body-strong text-text-1 mb-1">Camera access error</h3>
              <p className="text-small text-text-2 leading-relaxed">
                {cameraStatus === 'insecure_context'
                  ? 'Webcam streaming requires HTTPS or localhost.'
                  : 'An error occurred while initializing the video stream.'}
              </p>
            </>
          )}
        </div>
      )}

      {/* STATE G: WEBCAM LIVE, NO MODEL CONNECTED (DESIGN §6.6) */}
      {isLive && pipeline.model === 'none' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
          <div
            onClick={() => navigate('/models')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-chip bg-bg-2 border border-line-2 text-small text-text-2 hover:text-text-1 hover:border-accent cursor-pointer transition-colors duration-fast shadow-float"
          >
            <span>No detection model connected</span>
            <span className="text-accent flex items-center gap-0.5 font-medium">
              Connect model <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      )}

      {/* Subtle letterbox vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]" />
    </div>
  );
};
