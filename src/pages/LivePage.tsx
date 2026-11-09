import React, { useEffect, useState } from 'react';
import { Camera, Server, Sparkles, Video } from 'lucide-react';
import { ViewportCard } from '@/components/live/ViewportCard';
import { FloatingToolbar } from '@/components/live/FloatingToolbar';
import { IntelContent } from '@/components/intel/IntelContent';
import { Card, Button } from '@/components/ui';
import { useCameraStore } from '@/stores/cameraStore';
import { useDetectionStore } from '@/stores/detectionStore';
import { setActiveDetectionSource, startDetectionPipeline } from '@/lib/useDetectionPipeline';
import { backendAvailable } from '@/sources/apiPollingSource';

export const LivePage: React.FC = () => {
  const {
    status: cameraStatus,
    mode: cameraMode,
    startWebcamAction,
    setMode,
    setStatus,
    setFps,
    setLatency,
  } = useCameraStore();

  const { tracks, visibleTracks, pipelineRunning } = useDetectionStore();

  const isDemo = cameraMode === 'demo';
  const isStreaming = cameraStatus === 'connected' || cameraStatus === 'requesting' || (isDemo && pipelineRunning);

  // Progressive disclosure: offer the backend only when it answers.
  const [hasBackend, setHasBackend] = useState(false);
  useEffect(() => {
    let alive = true;
    backendAvailable().then((ok) => alive && setHasBackend(ok));
    return () => {
      alive = false;
    };
  }, []);
  const hasDetections = tracks.length > 0 || visibleTracks.length > 0;

  const handleStartWebcam = async () => {
    setMode('webcam');
    await startWebcamAction();
  };

  const handleStartBackend = async () => {
    setActiveDetectionSource('api');
    setMode('remote');
    setStatus('connected');
    await startDetectionPipeline();
  };

  const handleStartDemo = async () => {
    setActiveDetectionSource('synthetic');
    setMode('demo');
    setStatus('connected');
    setFps(30);
    setLatency(33);
    await startDetectionPipeline();
  };

  // STATE 1: Start State (No source running) per DESIGN.md §5.1
  // Rail, page title, settings gear and one centered start card on dot-grid canvas.
  if (!isStreaming) {
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center p-4">
        <Card className="animate-pop max-w-[420px] w-full p-6 text-center flex flex-col items-center gap-4 bg-bg-2 border-line-1 rounded-card shadow-float select-none">
          <div className="w-12 h-12 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-accent">
            <Camera className="w-7 h-7 text-accent" />
          </div>

          <div className="space-y-1">
            <h2 className="text-title text-text-1 font-semibold">Start monitoring</h2>
            <p className="text-small text-text-2 leading-relaxed">
              Use your webcam or a demo scene to see live detections.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full pt-2">
            <Button
              variant="primary"
              size={36}
              icon={<Video className="w-4 h-4" />}
              className="w-full flex-1 justify-center"
              onClick={handleStartWebcam}
            >
              Start webcam
            </Button>
            <Button
              variant="secondary"
              size={36}
              icon={<Sparkles className="w-4 h-4 text-accent" />}
              className="w-full flex-1 justify-center"
              onClick={handleStartDemo}
            >
              Try demo scene
            </Button>
          </div>

          {hasBackend && (
            <Button
              variant="ghost"
              size={32}
              icon={<Server className="w-4 h-4" />}
              className="w-full justify-center"
              onClick={handleStartBackend}
            >
              Connect to backend feed
            </Button>
          )}
        </Card>
      </div>
    );
  }

  // STATE 2: Streaming, nothing detected yet -> Viewport + Toolbar fill full width
  // STATE 3: Detections arriving -> Side panel slides in from the right (240ms)
  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 h-full overflow-y-auto lg:overflow-hidden pb-20 sm:pb-0 select-none">
      {/* Main Column: Viewport + Floating Toolbar */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 h-full overflow-hidden">
        <ViewportCard />
        <FloatingToolbar />
      </div>

      {/* Side Panel: Slides in only when detections arrive (State 3) */}
      {hasDetections && (
        <aside className="animate-slide-left w-full lg:w-intel-sm xl:w-intel shrink-0 h-auto lg:h-full overflow-y-auto no-scrollbar">
          <IntelContent />
        </aside>
      )}
    </div>
  );
};
