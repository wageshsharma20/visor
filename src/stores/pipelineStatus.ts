import { useCameraStore } from './cameraStore';
import { useModelStore } from './modelStore';

export type CameraPipeStatus = 'off' | 'requesting' | 'live' | 'error';
export type SourcePipeStatus = 'none' | 'webcam' | 'demo';
export type ModelPipeStatus = 'none' | 'deploying' | 'running' | 'failed';

export interface PipelineStatus {
  camera: CameraPipeStatus;
  source: SourcePipeStatus;
  model: ModelPipeStatus;
  simulated: boolean;
  cameraDisplay: string;
  sourceDisplay: string;
  modelDisplay: string;
}

export function usePipelineStatus(): PipelineStatus {
  const cameraStatus = useCameraStore((s) => s.status);
  const cameraResolution = useCameraStore((s) => s.resolution);
  const cameraMode = useCameraStore((s) => s.mode);

  const modelStatus = useModelStore((s) => s.status);
  const activeModel = useModelStore((s) => s.activeModel);
  const isSimulated = useModelStore((s) => s.isSimulated);

  // 1. Camera pipeline status
  let camera: CameraPipeStatus = 'off';
  if (cameraStatus === 'connected') {
    camera = 'live';
  } else if (cameraStatus === 'requesting') {
    camera = 'requesting';
  } else if (cameraStatus === 'idle') {
    camera = 'off';
  } else {
    camera = 'error';
  }

  // 2. Source pipeline status (source is active only when camera is live)
  let source: SourcePipeStatus = 'none';
  if (camera === 'live') {
    source = cameraMode === 'webcam' ? 'webcam' : 'demo';
  }

  // 3. Model pipeline status
  let model: ModelPipeStatus = 'none';
  if (modelStatus === 'running') {
    model = 'running';
  } else if (modelStatus === 'deploying') {
    model = 'deploying';
  } else if (modelStatus === 'failed') {
    model = 'failed';
  } else {
    model = 'none';
  }

  const simulated = isSimulated;

  // 4. Formatted display labels per requirements
  const cameraDisplay =
    camera === 'live'
      ? `CAM_01 · ${cameraResolution.width}×${cameraResolution.height}`
      : camera === 'requesting'
      ? 'CAM_01 · connecting…'
      : 'CAM_01 · offline';

  const sourceDisplay =
    source === 'webcam' ? 'WEBCAM' : source === 'demo' ? 'DEMO' : 'NO SOURCE';

  let modelDisplay = 'NO MODEL';
  if (model === 'running') {
    const name = activeModel?.name || 'yolov8n';
    const version = activeModel?.version || '1.2.0';
    modelDisplay = simulated ? `${name}@${version} · SIMULATED` : `${name} · LIVE`;
  } else if (model === 'deploying') {
    modelDisplay = 'DEPLOYING…';
  } else if (model === 'failed') {
    modelDisplay = 'DEPLOY FAILED';
  }

  return {
    camera,
    source,
    model,
    simulated,
    cameraDisplay,
    sourceDisplay,
    modelDisplay,
  };
}
