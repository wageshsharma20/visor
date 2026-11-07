import { create } from 'zustand';
import { CameraMode, CameraStatus, CameraResolution } from '@/types/camera';
import { startWebcam, stopMediaStream, CameraError } from '@/lib/camera';

export interface CameraState {
  mode: CameraMode;
  status: CameraStatus;
  stream: MediaStream | null;
  resolution: CameraResolution;
  fps: number;
  latencyMs: number;
  mirror: boolean;
  paused: boolean;
  activeDeviceId: string | null;
  errorMessage: string | null;

  startWebcamAction: () => Promise<void>;
  onVideoPlaying: (videoEl: HTMLVideoElement) => void;
  stopWebcamAction: () => void;
  setMode: (mode: CameraMode) => void;
  setStatus: (status: CameraStatus) => void;
  setStream: (stream: MediaStream | null) => void;
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
  mode: 'webcam' as CameraMode,
  status: 'idle' as CameraStatus,
  stream: null as MediaStream | null,
  resolution: { width: 1920, height: 1080 },
  fps: 0,
  latencyMs: 0,
  mirror: true,
  paused: false,
  activeDeviceId: null,
  errorMessage: null,
};

export const useCameraStore = create<CameraState>((set, get) => ({
  ...initialState,

  startWebcamAction: async () => {
    const { stream: currentStream, activeDeviceId } = get();
    stopMediaStream(currentStream);

    set({ status: 'requesting', errorMessage: null });

    try {
      const stream = await startWebcam({
        deviceId: activeDeviceId ?? undefined,
      });

      // Attach stream to state, but status becomes 'connected' only on video 'playing' event
      set({ stream, errorMessage: null });
    } catch (err: unknown) {
      if (err instanceof CameraError) {
        if (err.code === 'denied') {
          set({ status: 'denied', stream: null, errorMessage: err.message });
        } else if (err.code === 'in_use') {
          set({ status: 'in_use', stream: null, errorMessage: err.message });
        } else if (err.code === 'not_found') {
          set({ status: 'no_camera', stream: null, errorMessage: err.message });
        } else if (err.code === 'insecure_context') {
          set({ status: 'insecure_context', stream: null, errorMessage: err.message });
        } else {
          set({ status: 'error', stream: null, errorMessage: err.message });
        }
      } else {
        set({
          status: 'error',
          stream: null,
          errorMessage: (err as Error).message || 'Failed to start camera',
        });
      }
    }
  },

  onVideoPlaying: (videoEl: HTMLVideoElement) => {
    const videoWidth = videoEl.videoWidth || 1920;
    const videoHeight = videoEl.videoHeight || 1080;

    set({
      status: 'connected',
      resolution: { width: videoWidth, height: videoHeight },
      fps: 30,
      latencyMs: 33,
    });
  },

  stopWebcamAction: () => {
    const { stream } = get();
    stopMediaStream(stream);
    set({
      stream: null,
      status: 'idle',
      paused: false,
      fps: 0,
      latencyMs: 0,
      errorMessage: null,
    });
  },

  setMode: (mode) => {
    // Stop stream on mode change per requirement
    const { stream } = get();
    stopMediaStream(stream);
    set({ mode, stream, status: 'idle', fps: 0, latencyMs: 0 });
  },

  setStatus: (status) => set({ status }),
  setStream: (stream) => set({ stream }),
  setResolution: (resolution) => set({ resolution }),
  setFps: (fps) => set({ fps }),
  setLatency: (latencyMs) => set({ latencyMs }),
  setMirror: (mirror) => set({ mirror }),
  setPaused: (paused) => set({ paused }),
  setActiveDeviceId: (activeDeviceId) => set({ activeDeviceId }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),

  reset: () => {
    const { stream } = get();
    stopMediaStream(stream);
    set(initialState);
  },
}));
