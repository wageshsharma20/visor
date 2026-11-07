export type CameraMode = 'webcam' | 'demo';

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'connected'
  | 'paused'
  | 'error'
  | 'denied'
  | 'in_use'
  | 'no_camera'
  | 'insecure_context';

export interface CameraResolution {
  width: number;
  height: number;
}

export interface CameraDevice {
  deviceId: string;
  label: string;
}
