export type ModelDeploymentStatus =
  | 'not_configured'
  | 'ready'
  | 'deploying'
  | 'running'
  | 'stopped'
  | 'failed';

export type ModelRuntime = 'ONNX Runtime' | 'TensorRT' | 'PyTorch' | 'TFLite';

export type ModelTaskType =
  | 'Object detection'
  | 'Segmentation'
  | 'Pose'
  | 'Vision-language';

export interface ModelConfig {
  id: string;
  name: string;
  version: string;
  description?: string;
  taskType: ModelTaskType;
  runtime: ModelRuntime;
  resolution: number;
  confidenceThreshold: number;
  iouThreshold: number;
  classes: string[];
  watchlist: string[];
}
