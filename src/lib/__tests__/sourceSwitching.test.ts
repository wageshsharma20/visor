import { describe, it, expect, beforeEach } from 'vitest';
import {
  globalTracker,
  registerSource,
  setActiveDetectionSource,
  getActiveDetectionSource,
  useDetectionPipeline,
} from '../useDetectionPipeline';
import { useDetectionStore } from '@/stores/detectionStore';
import {
  DetectionFrame,
  DetectionSource,
  SourceStatus,
  DescriptionUpdate,
} from '@/types/detection';
import { renderHook, act } from '@testing-library/react';

class MockDetectionSource implements DetectionSource {
  readonly id = 'mock-source';
  readonly kind = 'simulated' as const;
  readonly label = 'MOCK · SOURCE';

  private frameListeners = new Set<(f: DetectionFrame) => void>();
  private statusListeners = new Set<(s: SourceStatus) => void>();
  public isStarted = false;

  async start(): Promise<void> {
    this.isStarted = true;
  }

  stop(): void {
    this.isStarted = false;
  }

  pause(): void {}
  resume(): void {}

  onFrame(cb: (f: DetectionFrame) => void): () => void {
    this.frameListeners.add(cb);
    return () => this.frameListeners.delete(cb);
  }

  onDescription(_cb: (d: DescriptionUpdate) => void): () => void {
    return () => {};
  }

  onStatus(cb: (s: SourceStatus) => void): () => void {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  emitMockFrame(frame: DetectionFrame): void {
    for (const listener of this.frameListeners) {
      listener(frame);
    }
  }

  getListenerCount(): number {
    return this.frameListeners.size;
  }
}

describe('Detection Pipeline Source Switching', () => {
  let mockSource: MockDetectionSource;

  beforeEach(() => {
    mockSource = new MockDetectionSource();
    registerSource('websocket', mockSource); // Map websocket to our mock source for test
    useDetectionStore.getState().clear();
    useDetectionStore.getState().setActiveSourceType('synthetic');
  });

  it('unsubscribes and stops old source and delivers only mock frames upon switching', async () => {
    const { unmount } = renderHook(() => useDetectionPipeline());

    // Initially active source is synthetic
    expect(useDetectionStore.getState().activeSourceType).toBe('synthetic');

    // Switch to mock source with resetOnSwitch=true
    act(() => {
      setActiveDetectionSource('websocket', { resetOnSwitch: true });
    });

    expect(getActiveDetectionSource().id).toBe('mock-source');
    expect(mockSource.getListenerCount()).toBe(1);

    // Emit a frame from mock source
    const mockFrame: DetectionFrame = {
      frameId: 999,
      ts: Date.now(),
      source: { width: 1280, height: 720 },
      detections: [
        {
          trackId: 'MOCK_01',
          classId: 'car',
          confidence: 0.98,
          bbox: { x: 0.2, y: 0.3, w: 0.1, h: 0.1 },
        },
      ],
    };

    act(() => {
      mockSource.emitMockFrame(mockFrame);
    });

    // Verify tracker contains the mock detection
    const mockTrack = globalTracker.getTrack('MOCK_01');
    expect(mockTrack).toBeDefined();
    expect(mockTrack?.classId).toBe('car');

    // Switch back to synthetic
    act(() => {
      setActiveDetectionSource('synthetic', { resetOnSwitch: true });
    });

    // Mock source listener should now be removed (unsubscribed)
    expect(mockSource.getListenerCount()).toBe(0);

    // Emitting on mock source after switch does NOT reach tracker
    act(() => {
      mockSource.emitMockFrame({
        frameId: 1000,
        ts: Date.now(),
        source: { width: 1280, height: 720 },
        detections: [
          {
            trackId: 'MOCK_02',
            classId: 'person',
            confidence: 0.99,
            bbox: { x: 0.1, y: 0.1, w: 0.1, h: 0.2 },
          },
        ],
      });
    });

    expect(globalTracker.getTrack('MOCK_02')).toBeUndefined();

    unmount();
  });
});
