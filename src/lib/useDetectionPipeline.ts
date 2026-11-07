import { useEffect, useRef } from 'react';
import { Tracker } from '@/engine/tracker';
import { SimulatedSceneSource } from '@/sources/simulatedScene';
import { WebSocketSource } from '@/sources/websocketSource';
import { RecordedTracksSource } from '@/sources/recordedTracks';
import {
  ActiveSourceType,
  useDetectionStore,
} from '@/stores/detectionStore';
import { useUiStore } from '@/stores/uiStore';
import {
  DetectionFrame,
  DescriptionUpdate,
  DetectionSource,
  SourceStatus,
} from '@/types/detection';

// Singleton tracker and sources
export const globalTracker = new Tracker();
export const globalSimulatedSource = new SimulatedSceneSource();
export const globalWebSocketSource = new WebSocketSource();
export const globalRecordedSource = new RecordedTracksSource();

const sourceRegistry = new Map<ActiveSourceType, DetectionSource>([
  ['synthetic', globalSimulatedSource],
  ['recorded', globalRecordedSource],
  ['websocket', globalWebSocketSource],
]);

export function registerSource(type: ActiveSourceType, source: DetectionSource): void {
  sourceRegistry.set(type, source);
}

export function getSourceInstance(type: ActiveSourceType): DetectionSource {
  return sourceRegistry.get(type) ?? globalSimulatedSource;
}

export function getActiveDetectionSource(): DetectionSource {
  const activeType = useDetectionStore.getState().activeSourceType;
  return getSourceInstance(activeType);
}

export function setActiveDetectionSource(
  type: ActiveSourceType,
  options?: { resetOnSwitch?: boolean }
): void {
  useDetectionStore.getState().setActiveSourceType(type, options);
}

export function startDetectionPipeline(): Promise<void> {
  useDetectionStore.getState().setPipelineRunning(true);
  const source = getActiveDetectionSource();
  return source.start({});
}

export function stopDetectionPipeline(): void {
  useDetectionStore.getState().setPipelineRunning(false);
  const source = getActiveDetectionSource();
  source.stop();
}

export function pauseDetectionPipeline(): void {
  const source = getActiveDetectionSource();
  source.pause();
}

export function resumeDetectionPipeline(): void {
  const source = getActiveDetectionSource();
  source.resume();
}

/**
 * Top-level detection pipeline hook.
 * Re-subscribes whenever active source changes:
 * stops old source, cleans up tracks if resetOnSwitch=true, and subscribes to new source.
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
  const activeSourceType = useDetectionStore((s) => s.activeSourceType);
  const websocketUrl = useDetectionStore((s) => s.websocketUrl);
  const resetOnSwitch = useDetectionStore((s) => s.resetOnSwitch);
  const pipelineRunning = useDetectionStore((s) => s.pipelineRunning);

  const syncFromTracker = useDetectionStore((s) => s.syncFromTracker);
  const setSourceStatus = useDetectionStore((s) => s.setSourceStatus);

  const totalFramesRef = useRef(0);
  const lastLatencyRef = useRef(15);
  const lastFrameTsRef = useRef(Date.now());
  const fpsCounterRef = useRef({ frames: 0, lastCalc: performance.now(), fps: 0 });

  // Sync threshold changes to tracker
  useEffect(() => {
    globalTracker.setThreshold(threshold);
  }, [threshold]);

  // Active source subscription lifecycle
  useEffect(() => {
    const currentSource = getSourceInstance(activeSourceType);

    if (activeSourceType === 'websocket' && 'setUrl' in currentSource) {
      (currentSource as WebSocketSource).setUrl(websocketUrl);
    }

    // Reset tracker if configured
    if (resetOnSwitch) {
      globalTracker.clear();
      useDetectionStore.getState().clear();
      totalFramesRef.current = 0;
      fpsCounterRef.current = { frames: 0, lastCalc: performance.now(), fps: 0 };
    }

    const FLUSH_INTERVAL_MS = 250; // 4 Hz
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
      const receiptTime = Date.now();
      totalFramesRef.current++;
      lastFrameTsRef.current = frame.ts;
      if (frame.latencyMs !== undefined) {
        lastLatencyRef.current = frame.latencyMs;
      }

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

      // One clock: receiptTime is passed to tracker for all timeouts and lastSeen
      globalTracker.ingest(frame, receiptTime);

      if (nowPerf - lastFlushTime >= FLUSH_INTERVAL_MS) {
        flushState();
      }
    };

    const handleDescription = (desc: DescriptionUpdate) => {
      globalTracker.updateDescription(desc.trackId, desc.text);
      flushState();
    };

    const handleStatus = (status: SourceStatus) => {
      setSourceStatus(status);
    };

    const unsubFrame = currentSource.onFrame(handleFrame);
    const unsubDesc = currentSource.onDescription(handleDescription);
    const unsubStatus = currentSource.onStatus(handleStatus);

    // If pipeline was running, start the new source
    if (pipelineRunning) {
      currentSource.start({});
    }

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
      currentSource.stop();
    };
  }, [
    activeSourceType,
    websocketUrl,
    resetOnSwitch,
    pipelineRunning,
    syncFromTracker,
    setSourceStatus,
  ]);

  return {
    tracker: globalTracker,
    source: getActiveDetectionSource(),
    start: startDetectionPipeline,
    stop: stopDetectionPipeline,
    pause: pauseDetectionPipeline,
    resume: resumeDetectionPipeline,
  };
}
