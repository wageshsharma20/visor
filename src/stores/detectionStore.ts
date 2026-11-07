import { create } from 'zustand';
import {
  DetectionEvent,
  SourceStatus,
  Track,
} from '@/types/detection';

export interface DetectionState {
  tracks: Track[];
  visibleTracks: Track[];
  events: DetectionEvent[];
  fps: number;
  latencyMs: number;
  totalFrames: number;
  lastFrameTs: number;
  sourceStatus: SourceStatus;
  activeSourceId: string | null;
  pipelineRunning: boolean;

  setPipelineRunning: (running: boolean) => void;
  setSourceStatus: (status: SourceStatus) => void;
  setActiveSourceId: (id: string | null) => void;
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
  activeSourceId: null as string | null,
  pipelineRunning: false,
};

export const useDetectionStore = create<DetectionState>((set) => ({
  ...initialState,

  setPipelineRunning: (pipelineRunning) => set({ pipelineRunning }),
  setSourceStatus: (sourceStatus) => set({ sourceStatus }),
  setActiveSourceId: (activeSourceId) => set({ activeSourceId }),

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
