import { create } from 'zustand';
import {
  DetectionEvent,
  SourceStatus,
  Track,
} from '@/types/detection';

export type ActiveSourceType = 'synthetic' | 'recorded' | 'websocket' | 'api';

export interface DetectionState {
  tracks: Track[];
  visibleTracks: Track[];
  events: DetectionEvent[];
  fps: number;
  latencyMs: number;
  totalFrames: number;
  lastFrameTs: number;
  sourceStatus: SourceStatus;
  activeSourceId: string;
  activeSourceType: ActiveSourceType;
  websocketUrl: string;
  resetOnSwitch: boolean;
  pipelineRunning: boolean;

  setPipelineRunning: (running: boolean) => void;
  setSourceStatus: (status: SourceStatus) => void;
  setActiveSourceType: (
    type: ActiveSourceType,
    options?: { resetOnSwitch?: boolean }
  ) => void;
  setWebsocketUrl: (url: string) => void;
  setResetOnSwitch: (reset: boolean) => void;
  syncFromTracker: (payload: {
    tracks: Track[];
    visibleTracks: Track[];
    events: DetectionEvent[];
    fps: number;
    latencyMs: number;
    totalFrames: number;
    lastFrameTs: number;
  }) => void;
  clear: () => void;
}

const initialState = {
  tracks: [] as Track[],
  visibleTracks: [] as Track[],
  events: [] as DetectionEvent[],
  fps: 0,
  latencyMs: 0,
  totalFrames: 0,
  lastFrameTs: 0,
  sourceStatus: { state: 'idle' as const },
  activeSourceId: 'simulated-synthetic',
  activeSourceType: 'synthetic' as ActiveSourceType,
  websocketUrl: 'wss://localhost:8765',
  resetOnSwitch: true,
  pipelineRunning: false,
};

export const useDetectionStore = create<DetectionState>((set) => ({
  ...initialState,

  setPipelineRunning: (pipelineRunning) => set({ pipelineRunning }),
  setSourceStatus: (sourceStatus) => set({ sourceStatus }),
  setActiveSourceType: (activeSourceType, options) =>
    set((state) => ({
      activeSourceType,
      activeSourceId:
        activeSourceType === 'synthetic'
          ? 'simulated-synthetic'
          : activeSourceType === 'recorded'
          ? 'demo-recorded'
          : activeSourceType === 'api'
          ? 'remote-api'
          : 'remote-websocket',
      resetOnSwitch:
        options?.resetOnSwitch !== undefined
          ? options.resetOnSwitch
          : state.resetOnSwitch,
    })),
  setWebsocketUrl: (websocketUrl) => set({ websocketUrl }),
  setResetOnSwitch: (resetOnSwitch) => set({ resetOnSwitch }),

  syncFromTracker: ({
    tracks,
    visibleTracks,
    events,
    fps,
    latencyMs,
    totalFrames,
    lastFrameTs,
  }) =>
    set({
      tracks,
      visibleTracks,
      events,
      fps,
      latencyMs,
      totalFrames,
      lastFrameTs,
    }),

  clear: () =>
    set({
      tracks: [],
      visibleTracks: [],
      events: [],
      totalFrames: 0,
      lastFrameTs: 0,
      fps: 0,
      latencyMs: 0,
    }),
}));
