import { describe, it, expect, beforeEach } from 'vitest';
import { useCameraStore } from '../cameraStore';
import { useModelStore } from '../modelStore';
import { useUiStore } from '../uiStore';
import { usePipelineStatus } from '../pipelineStatus';
import { renderHook, act } from '@testing-library/react';

describe('Zustand Stores & Pipeline Status', () => {
  beforeEach(() => {
    useCameraStore.getState().reset();
    useModelStore.getState().reset();
    useUiStore.getState().reset();
  });

  describe('cameraStore', () => {
    it('initializes in idle webcam mode with 1080p resolution', () => {
      const state = useCameraStore.getState();
      expect(state.mode).toBe('webcam');
      expect(state.status).toBe('idle');
      expect(state.resolution).toEqual({ width: 1920, height: 1080 });
      expect(state.fps).toBe(0);
      expect(state.paused).toBe(false);
      expect(state.mirror).toBe(true);
      expect(state.stream).toBeNull();
    });

    it('updates mode and status cleanly', () => {
      useCameraStore.getState().setStatus('connected');
      useCameraStore.getState().setFps(30);

      const state = useCameraStore.getState();
      expect(state.mode).toBe('webcam');
      expect(state.status).toBe('connected');
      expect(state.fps).toBe(30);
    });

    it('stops stream cleanly on stopWebcamAction', () => {
      useCameraStore.getState().setStatus('connected');
      useCameraStore.getState().stopWebcamAction();

      const state = useCameraStore.getState();
      expect(state.status).toBe('idle');
      expect(state.stream).toBeNull();
      expect(state.fps).toBe(0);
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
        version: '1.2.0',
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

  describe('pipelineStatus derived selector', () => {
    it('reports offline and NO MODEL in initial state', () => {
      const { result } = renderHook(() => usePipelineStatus());
      expect(result.current.camera).toBe('off');
      expect(result.current.source).toBe('none');
      expect(result.current.model).toBe('none');
      expect(result.current.cameraDisplay).toBe('CAM_01 · offline');
      expect(result.current.sourceDisplay).toBe('NO SOURCE');
      expect(result.current.modelDisplay).toBe('NO MODEL');
    });

    it('reports amber SIMULATED model display when simulated model is deployed', () => {
      act(() => {
        useModelStore.getState().setActiveModel({
          id: 'yolov8n-custom',
          name: 'yolov8n',
          version: '1.2.0',
          runtime: 'ONNX Runtime',
          taskType: 'Object detection',
          resolution: 640,
          confidenceThreshold: 0.5,
          iouThreshold: 0.45,
          classes: ['person'],
          watchlist: [],
        });
        useModelStore.getState().setStatus('running');
        useModelStore.getState().setIsSimulated(true);
      });

      const { result } = renderHook(() => usePipelineStatus());
      expect(result.current.model).toBe('running');
      expect(result.current.simulated).toBe(true);
      expect(result.current.modelDisplay).toBe('yolov8n@1.2.0 · SIMULATED');
    });

    it('reports CAM_01 with resolution when camera is connected', () => {
      act(() => {
        useCameraStore.getState().setStatus('connected');
        useCameraStore.getState().setResolution({ width: 1920, height: 1080 });
      });

      const { result } = renderHook(() => usePipelineStatus());
      expect(result.current.camera).toBe('live');
      expect(result.current.source).toBe('webcam');
      expect(result.current.cameraDisplay).toBe('CAM_01 · 1920×1080');
      expect(result.current.sourceDisplay).toBe('WEBCAM');
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
      expect(state.isSettingsOpen).toBe(false);
      expect(state.isDrawerOpen).toBe(false);
    });

    it('toggles settings drawer and updates settings', () => {
      useUiStore.getState().toggleSettings();
      expect(useUiStore.getState().isSettingsOpen).toBe(true);

      useUiStore.getState().setThreshold(0.75);
      expect(useUiStore.getState().threshold).toBe(0.75);

      useUiStore.getState().setShowTrails(true);
      expect(useUiStore.getState().showTrails).toBe(true);
    });
  });
});
