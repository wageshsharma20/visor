import React, { useState, useEffect, useRef } from 'react';
import {
  Zap,
  UploadCloud,
  CheckCircle2,
  X,
  Radio,
  Sliders,
  Layers,
  Network,
  AlertTriangle,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  Button,
  Select,
  Input,
  Slider,
  StatusDot,
} from '@/components/ui';
import {
  GraphCanvas,
  NodeCard,
  HubNode,
  Wire,
} from '@/components/graph';
import { ModelRuntime, ModelTaskType } from '@/types/model';
import { useModelStore } from '@/stores/modelStore';
import { useCameraStore } from '@/stores/cameraStore';

export const ModelsPage: React.FC = () => {
  const {
    status: deploymentStatus,
    endpointUrl,
    setActiveModel,
    setStatus: setDeploymentStatus,
    setEndpointUrl,
    setIsSimulated,
  } = useModelStore();

  const { mode, setMode } = useCameraStore();

  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [modelName, setModelName] = useState('yolov8n');
  const [modelVersion, setModelVersion] = useState('1.2.0');
  const [runtime, setRuntime] = useState('ONNX Runtime');
  const [taskType, setTaskType] = useState('Object detection');
  const [confThreshold, setConfThreshold] = useState(0.5);
  const [iouThreshold, setIouThreshold] = useState(0.45);

  const [wsUrl, setWsUrl] = useState(endpointUrl);
  const [wsError, setWsError] = useState<string | null>(null);
  const [wsTesting, setWsTesting] = useState(false);
  const [wsStatus, setWsStatus] = useState<{ success: boolean; message: string } | null>(null);
  const activeSocketRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRunning = deploymentStatus === 'running';

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (activeSocketRef.current) {
        try {
          activeSocketRef.current.close();
        } catch {
          // Socket already closed
        }
      }
    };
  }, []);

  const handleDeployToggle = () => {
    if (isRunning) {
      setDeploymentStatus('stopped');
      setActiveModel(null);
      setIsSimulated(false);
    } else {
      setDeploymentStatus('running');
      setIsSimulated(true);
      setActiveModel({
        id: 'yolov8n-custom',
        name: modelName,
        version: modelVersion,
        runtime: runtime as ModelRuntime,
        taskType: taskType as ModelTaskType,
        resolution: 640,
        confidenceThreshold: confThreshold,
        iouThreshold,
        classes: ['person', 'vehicle', 'bag', 'animal'],
        watchlist: ['suitcase'],
      });
    }
  };

  const validateWsUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) {
      setWsError(null);
      return false;
    }
    if (!trimmed.startsWith('ws://') && !trimmed.startsWith('wss://')) {
      setWsError('URL must begin with ws:// or wss://');
      return false;
    }
    setWsError(null);
    return true;
  };

  const handleTestWs = () => {
    if (!validateWsUrl(wsUrl)) {
      if (!wsUrl.trim()) setWsError('Please enter a WebSocket URL');
      return;
    }

    setWsTesting(true);
    setWsStatus(null);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (activeSocketRef.current) {
      try {
        activeSocketRef.current.close();
      } catch {
        // Socket already closed
      }
    }

    try {
      const socket = new WebSocket(wsUrl.trim());
      activeSocketRef.current = socket;

      timerRef.current = setTimeout(() => {
        try {
          socket.close();
        } catch {
          // Socket already closed
        }
        setWsTesting(false);
        setWsStatus({
          success: false,
          message: 'Connection timed out after 5000ms. Host unreachable.',
        });
      }, 5000);

      socket.onopen = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        try {
          socket.close();
        } catch {
          // Socket already closed
        }
        setWsTesting(false);
        setWsStatus({
          success: true,
          message: 'Handshake accepted. Remote endpoint connected successfully.',
        });
      };

      socket.onerror = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setWsTesting(false);
        setWsStatus({
          success: false,
          message: 'Connection failed. Endpoint rejected handshake or is offline.',
        });
      };
    } catch (err: unknown) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setWsTesting(false);
      setWsStatus({
        success: false,
        message: (err as Error).message || 'Invalid WebSocket endpoint address.',
      });
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto w-full pb-16 sm:pb-8">
      {/* Top Header & Amber Meta-Chip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-small text-text-2">Choose a model and tune its thresholds.</p>
        </div>

        <Button
          variant={isRunning ? 'danger' : 'accent'}
          size={36}
          icon={<Zap className="w-4 h-4" />}
          onClick={handleDeployToggle}
        >
          {isRunning ? 'Stop Model Deployment' : 'Deploy Model (Simulated)'}
        </Button>
      </div>

      {/* Dismissible Amber Notice per SPEC.md §10 */}
      {!noticeDismissed && (
        <div className="p-3 bg-amber/10 border border-amber/30 rounded-card flex items-start justify-between gap-3 text-small text-amber select-none">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="font-medium">Notice:</strong> Deployment is simulated in this build.
              No local weights are executed. Connect a WebSocket endpoint below to stream real detections.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNoticeDismissed(true)}
            aria-label="Dismiss notice"
            className="text-amber/70 hover:text-amber p-0.5 rounded-chip hover:bg-amber/20 focus-visible:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Node Canvas (DESIGN.md §9): Unused ports removed */}
      <div className="p-4 bg-canvas bg-bg-2 border border-line-1 rounded-card overflow-hidden">
        <GraphCanvas className="w-full">
          {/* Row of nodes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* 1. SOURCE NODE (Only has right port) */}
            <NodeCard
              title="Source Node"
              icon={<Radio className="w-3.5 h-3.5 text-text-2" />}
              statusDot={<StatusDot state="idle" />}
              ports={{ right: 'source-out' }}
              className="bg-bg-2"
            >
              <div className="space-y-3">
                <Select
                  label="Input Feed"
                  value={mode}
                  onChange={(val) => setMode(val as 'webcam' | 'demo')}
                  options={[
                    { label: 'Local HD Webcam', value: 'webcam' },
                  ]}
                />
                <div className="flex justify-between text-data font-mono text-text-3 pt-1">
                  <span>Stream Resolution:</span>
                  <span className="text-text-1">1920×1080</span>
                </div>
              </div>
            </NodeCard>

            {/* 2. INFERENCE HUB (Center): Non-truncating multi-line label */}
            <div className="flex flex-col items-center justify-center py-4">
              <HubNode
                inPort="hub-in"
                outPort="hub-out"
                label={
                  isRunning ? (
                    <div className="text-center">
                      <span className="text-text-1 font-mono">{modelName}</span>
                      <span className="block text-data text-amber font-mono font-medium">
                        SIMULATED
                      </span>
                    </div>
                  ) : (
                    <span className="text-text-3 font-mono">Inference Hub</span>
                  )
                }
                active={isRunning}
                onClick={handleDeployToggle}
              />
            </div>

            {/* 3. OUTPUT PREVIEW NODE (Only has left port) */}
            <NodeCard
              title="Output Preview"
              icon={<Layers className="w-3.5 h-3.5 text-text-2" />}
              statusDot={<StatusDot state={isRunning ? 'warning' : 'idle'} />}
              ports={{ left: 'preview-in' }}
              className="bg-bg-2"
            >
              <div className="min-h-[110px] bg-bg-3 border border-line-1 rounded-control p-3 flex flex-col items-center justify-center text-center">
                {isRunning ? (
                  <div className="space-y-1">
                    <CheckCircle2 className="w-5 h-5 text-amber mx-auto" />
                    <div className="text-body-strong text-text-1">
                      {modelName}@{modelVersion}
                    </div>
                    <div className="text-data text-amber font-mono font-medium">
                      SIMULATED ACTIVE
                    </div>
                  </div>
                ) : (
                  <div className="text-small text-text-3">
                    Model stopped. Deploy to activate simulated stream.
                  </div>
                )}
              </div>
            </NodeCard>
          </div>

          {/* Connect Wires */}
          <Wire from="source-out" to="hub-in" state={isRunning ? 'streaming' : 'idle'} />
          <Wire from="hub-out" to="preview-in" state={isRunning ? 'streaming' : 'idle'} />
        </GraphCanvas>
      </div>

      {/* Configuration & Thresholds Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Model Configuration Card */}
        <Card>
          <CardHeader
            title="Model Architecture & Runtime"
            icon={<Zap className="w-3.5 h-3.5 text-text-2" />}
            statusDot={<StatusDot state="idle" />}
          />
          <div className="p-4 space-y-4">
            <div className="p-4 border border-dashed border-line-2 rounded-control bg-bg-3/30 flex flex-col items-center justify-center text-center hover:border-line-1 cursor-pointer transition-colors duration-fast">
              <UploadCloud className="w-6 h-6 text-text-3 mb-1.5" />
              <div className="text-small text-text-1 font-medium">Drop weight archive (.onnx, .pt, .tflite)</div>
              <div className="text-data text-text-3 font-mono mt-0.5">Maximum archive size 500 MB</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Model Identifier"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              />
              <Input
                label="Version (Semver)"
                value={modelVersion}
                onChange={(e) => setModelVersion(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Runtime Engine"
                value={runtime}
                onChange={setRuntime}
                options={[
                  { label: 'ONNX Runtime', value: 'ONNX Runtime' },
                  { label: 'TensorRT', value: 'TensorRT' },
                  { label: 'PyTorch Core', value: 'PyTorch' },
                  { label: 'TFLite Micro', value: 'TFLite' },
                ]}
              />
              <Select
                label="Task Type"
                value={taskType}
                onChange={setTaskType}
                options={[
                  { label: 'Object detection', value: 'Object detection' },
                  { label: 'Segmentation', value: 'Segmentation' },
                  { label: 'Pose Estimation', value: 'Pose' },
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Thresholds Card */}
        <Card>
          <CardHeader
            title="Inference & Watchlist Thresholds"
            icon={<Sliders className="w-3.5 h-3.5 text-text-2" />}
            statusDot={<StatusDot state="idle" />}
          />
          <div className="p-4 space-y-4">
            <Slider
              surface="card"
              label="Confidence Threshold"
              min={0.3}
              max={0.95}
              step={0.05}
              minLabel="30%"
              maxLabel="95%"
              value={confThreshold}
              onChange={setConfThreshold}
            />

            <Slider
              surface="card"
              label="NMS IoU Threshold"
              min={0.1}
              max={0.9}
              step={0.05}
              minLabel="10%"
              maxLabel="90%"
              value={iouThreshold}
              onChange={setIouThreshold}
            />

            <div>
              <div className="text-label text-text-2 mb-1.5">Active Detection Classes</div>
              <div className="flex flex-wrap gap-1.5">
                {['person', 'vehicle', 'backpack', 'handbag', 'suitcase', 'animal'].map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded-chip bg-bg-3 border border-line-1 text-data font-mono text-text-2"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* WebSocket Endpoint Form Card */}
      <Card>
        <CardHeader
          title="Remote WebSocket Telemetry Endpoint"
          icon={<Network className="w-3.5 h-3.5 text-text-2" />}
          statusDot={<StatusDot state="idle" />}
        />
        <div className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
            <div className="flex-1">
              <Input
                label="Endpoint URL (wss:// or ws://)"
                placeholder="wss://api.visor-telemetry.internal/stream"
                value={wsUrl}
                error={wsError || undefined}
                onBlur={() => validateWsUrl(wsUrl)}
                onChange={(e) => {
                  setWsUrl(e.target.value);
                  setEndpointUrl(e.target.value);
                  if (wsError) validateWsUrl(e.target.value);
                }}
              />
            </div>
            <Button
              variant="secondary"
              size={36}
              disabled={wsTesting}
              onClick={handleTestWs}
            >
              {wsTesting ? 'Testing connection…' : 'Test connection'}
            </Button>
          </div>

          {wsStatus && (
            <div
              className={`text-small font-mono p-2.5 rounded-control border ${
                wsStatus.success
                  ? 'bg-accent-dim border-accent text-accent'
                  : 'bg-bg-3 border-line-1 text-amber'
              }`}
            >
              {wsStatus.message}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
