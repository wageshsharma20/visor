import { describe, it, expect, beforeEach } from 'vitest';
import { useCameraStore } from '../cameraStore';
import { useModelStore } from '../modelStore';
import { useUiStore } from '../uiStore';

describe('Zustand Stores (Phase 2)', () => {
  beforeEach(() => {
    useCameraStore.getState().reset();
    useModelStore.getState().reset();
    useUiStore.getState().reset();
  });

  describe('cameraStore', () => {
    it('initializes in idle demo mode with 1080p resolution', () => {
      const state = useCameraStore.getState();
      expect(state.mode).toBe('demo');
      expect(state.status).toBe('idle');
      expect(state.resolution).toEqual({ width: 1920, height: 1080 });
      expect(state.fps).toBe(0);
      expect(state.paused).toBe(false);
      expect(state.mirror).toBe(true);
    });

    it('updates mode and status cleanly', () => {
      useCameraStore.getState().setMode('webcam');
      useCameraStore.getState().setStatus('connected');
      useCameraStore.getState().setFps(30);

      const state = useCameraStore.getState();
      expect(state.mode).toBe('webcam');
      expect(state.status).toBe('connected');
      expect(state.fps).toBe(30);
    });
  });

  describe('modelStore', () => {
    it('initializes with NO MODEL and NO SOURCE', () => {
      const state = useModelStore.getState();
      expect(state.activeModel).toBeNull();
      expect(state.status).toBe('not_configured');
      expect(state.sourceLabel).toBe('NO SOURCE');
      expect(state.isSimulated).toBe(true);
    });

    it('sets active model and deployment status', () => {
      useModelStore.getState().setActiveModel({
        id: 'test-model',
        name: 'yolov8n',
        version: '1.0.0',
        runtime: 'ONNX Runtime',
        taskType: 'Object detection',
        resolution: 640,
        confidenceThreshold: 0.5,
        iouThreshold: 0.45,
        classes: ['person'],
        watchlist: [],
      });
      useModelStore.getState().setStatus('running');

      const state = useModelStore.getState();
      expect(state.activeModel?.name).toBe('yolov8n');
      expect(state.status).toBe('running');
    });
  });

  describe('uiStore', () => {
    it('initializes with default threshold and display flags', () => {
      const state = useUiStore.getState();
      expect(state.threshold).toBe(0.5);
      expect(state.showBoxes).toBe(true);
      expect(state.showLabels).toBe(true);
      expect(state.showTrails).toBe(false);
      expect(state.timeWindow).toBe('5m');
      expect(state.activeWorkspace).toBe('Lobby-North');
      expect(state.isDrawerOpen).toBe(false);
    });

    it('toggles drawer and updates settings', () => {
      useUiStore.getState().toggleDrawer();
      expect(useUiStore.getState().isDrawerOpen).toBe(true);

      useUiStore.getState().setThreshold(0.75);
      expect(useUiStore.getState().threshold).toBe(0.75);

      useUiStore.getState().setShowTrails(true);
      expect(useUiStore.getState().showTrails).toBe(true);
    });
  });
});
