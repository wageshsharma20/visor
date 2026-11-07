import { create } from 'zustand';
import { CameraMode, CameraStatus, CameraResolution } from '@/types/camera';

export interface CameraState {
  mode: CameraMode;
  status: CameraStatus;
  resolution: CameraResolution;
  fps: number;
  latencyMs: number;
  mirror: boolean;
  paused: boolean;
  activeDeviceId: string | null;
  errorMessage: string | null;

  setMode: (mode: CameraMode) => void;
  setStatus: (status: CameraStatus) => void;
  setResolution: (resolution: CameraResolution) => void;
  setFps: (fps: number) => void;
  setLatency: (ms: number) => void;
  setMirror: (mirror: boolean) => void;
  setPaused: (paused: boolean) => void;
  setActiveDeviceId: (deviceId: string | null) => void;
  setErrorMessage: (msg: string | null) => void;
  reset: () => void;
}

const initialState = {
  mode: 'demo' as CameraMode,
  status: 'idle' as CameraStatus,
  resolution: { width: 1920, height: 1080 },
  fps: 0,
  latencyMs: 0,
  mirror: true,
  paused: false,
  activeDeviceId: null,
  errorMessage: null,
};

export const useCameraStore = create<CameraState>((set) => ({
  ...initialState,
  setMode: (mode) => set({ mode }),
  setStatus: (status) => set({ status }),
  setResolution: (resolution) => set({ resolution }),
  setFps: (fps) => set({ fps }),
  setLatency: (latencyMs) => set({ latencyMs }),
  setMirror: (mirror) => set({ mirror }),
  setPaused: (paused) => set({ paused }),
  setActiveDeviceId: (activeDeviceId) => set({ activeDeviceId }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  reset: () => set(initialState),
}));
