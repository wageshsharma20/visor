import { useEffect, useRef } from 'react';
import { Tracker } from '@/engine/tracker';
import { SimulatedSceneSource } from '@/sources/simulatedScene';
import { WebSocketSource } from '@/sources/websocketSource';
import { useDetectionStore } from '@/stores/detectionStore';
import { useUiStore } from '@/stores/uiStore';
import { DetectionFrame, DescriptionUpdate, DetectionSource } from '@/types/detection';

// Singleton tracker and source instances that persist across route changes
export const globalTracker = new Tracker();
export const globalSimulatedSource = new SimulatedSceneSource();
export const globalWebSocketSource = new WebSocketSource();

let activeSource: DetectionSource = globalSimulatedSource;

export function setActiveDetectionSource(source: DetectionSource): void {
  activeSource = source;
  useDetectionStore.getState().setActiveSourceId(source.id);
}

export function getActiveDetectionSource(): DetectionSource {
  return activeSource;
}

export function startDetectionPipeline(): Promise<void> {
  useDetectionStore.getState().setPipelineRunning(true);
  return activeSource.start({});
}

export function stopDetectionPipeline(): void {
  activeSource.stop();
  useDetectionStore.getState().setPipelineRunning(false);
}

export function pauseDetectionPipeline(): void {
  activeSource.pause();
}

export function resumeDetectionPipeline(): void {
  activeSource.resume();
}

/**
 * Top-level hook mounted in AppLayout.
 * Subscribes to the active source, feeds frames to Tracker, and batch-updates detectionStore at 4 Hz.
 */
export function useDetectionPipeline(): {
  tracker: Tracker;
  source: DetectionSource;
  start: () => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
} {
  const threshold = useUiStore((s) => s.threshold);
  const syncFromTracker = useDetectionStore((s) => s.syncFromTracker);
  const setSourceStatus = useDetectionStore((s) => s.setSourceStatus);

  const totalFramesRef = useRef(0);
  const lastLatencyRef = useRef(15);
  const lastFrameTsRef = useRef(Date.now());
  const fpsCounterRef = useRef({ frames: 0, lastCalc: performance.now(), fps: 0 });

  // Sync threshold changes to the tracker
  useEffect(() => {
    globalTracker.setThreshold(threshold);
  }, [threshold]);

  useEffect(() => {
    // Throttle batch sync to detectionStore to at most 4 Hz (250ms)
    const FLUSH_INTERVAL_MS = 250;
    let lastFlushTime = performance.now();

    const flushState = () => {
      syncFromTracker({
        tracks: globalTracker.getTracks(),
        visibleTracks: globalTracker.getVisibleTracks(),
        events: globalTracker.getEvents(),
        fps: fpsCounterRef.current.fps,
        latencyMs: lastLatencyRef.current,
        totalFrames: totalFramesRef.current,
        lastFrameTs: lastFrameTsRef.current,
      });
      lastFlushTime = performance.now();
    };

    const handleFrame = (frame: DetectionFrame) => {
      totalFramesRef.current++;
      lastFrameTsRef.current = frame.ts;
      if (frame.latencyMs !== undefined) {
        lastLatencyRef.current = frame.latencyMs;
      }

      // FPS calculation
      fpsCounterRef.current.frames++;
      const nowPerf = performance.now();
      const elapsed = nowPerf - fpsCounterRef.current.lastCalc;
      if (elapsed >= 1000) {
        fpsCounterRef.current.fps = Math.round(
          (fpsCounterRef.current.frames * 1000) / elapsed
        );
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastCalc = nowPerf;
      }

      // Ingest into tracker
      globalTracker.ingest(frame);

      // Throttled sync to React store
      if (nowPerf - lastFlushTime >= FLUSH_INTERVAL_MS) {
        flushState();
      }
    };

    const handleDescription = (desc: DescriptionUpdate) => {
      globalTracker.updateDescription(desc.trackId, desc.text);
      flushState();
    };

    const handleStatus = (status: import('@/types/detection').SourceStatus) => {
      setSourceStatus(status);
    };

    // Subscriptions
    const unsubFrame = activeSource.onFrame(handleFrame);
    const unsubDesc = activeSource.onDescription(handleDescription);
    const unsubStatus = activeSource.onStatus(handleStatus);

    // Periodic step timer for track timeouts (lost / exited)
    const stepInterval = window.setInterval(() => {
      globalTracker.step(Date.now());
      if (performance.now() - lastFlushTime >= FLUSH_INTERVAL_MS) {
        flushState();
      }
    }, FLUSH_INTERVAL_MS);

    return () => {
      unsubFrame();
      unsubDesc();
      unsubStatus();
      clearInterval(stepInterval);
    };
  }, [syncFromTracker, setSourceStatus]);

  return {
    tracker: globalTracker,
    source: activeSource,
    start: startDetectionPipeline,
    stop: stopDetectionPipeline,
    pause: pauseDetectionPipeline,
    resume: resumeDetectionPipeline,
  };
}
