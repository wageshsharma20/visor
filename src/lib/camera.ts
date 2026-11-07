export type CameraErrorCode =
  | 'denied'
  | 'not_found'
  | 'in_use'
  | 'insecure_context'
  | 'unknown';

export class CameraError extends Error {
  readonly code: CameraErrorCode;

  constructor(code: CameraErrorCode, message: string) {
    super(message);
    this.name = 'CameraError';
    this.code = code;
  }
}

export interface WebcamOptions {
  deviceId?: string;
  idealWidth?: number;
  idealHeight?: number;
}

/**
 * Request real user media webcam stream with typed errors per SPEC.md §6.
 */
export async function startWebcam(options: WebcamOptions = {}): Promise<MediaStream> {
  // Check secure context requirement
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    throw new CameraError(
      'insecure_context',
      'Camera access requires HTTPS or localhost.'
    );
  }

  if (
    typeof navigator === 'undefined' ||
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    throw new CameraError(
      'not_found',
      'No camera input API supported in this browser environment.'
    );
  }

  const constraints: MediaStreamConstraints = {
    audio: false,
    video: {
      deviceId: options.deviceId ? { exact: options.deviceId } : undefined,
      width: { ideal: options.idealWidth ?? 1920 },
      height: { ideal: options.idealHeight ?? 1080 },
    },
  };

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err: unknown) {
    const error = err as Error;
    const name = error.name || '';

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      throw new CameraError(
        'denied',
        'Camera permission was denied. Enable access in browser permissions.'
      );
    }
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      throw new CameraError(
        'not_found',
        'No video capture device was found on this system.'
      );
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      throw new CameraError(
        'in_use',
        'Camera is already in use by another application or tab.'
      );
    }

    throw new CameraError('unknown', error.message || 'Unable to access camera.');
  }
}

/**
 * Release all media tracks immediately so hardware camera LED turns off.
 */
export function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) return;
  try {
    const tracks = stream.getTracks();
    for (const track of tracks) {
      track.stop();
    }
  } catch {
    // Ignore cleanup errors
  }
}
