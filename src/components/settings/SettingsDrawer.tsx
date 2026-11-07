import React from 'react';
import {
  Camera,
  RotateCcw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import {
  Drawer,
  Card,
  CardHeader,
  Button,
  Switch,
  Slider,
  StatusDot,
} from '@/components/ui';
import { useCameraStore } from '@/stores/cameraStore';
import { useUiStore } from '@/stores/uiStore';
import { useModelStore } from '@/stores/modelStore';

export interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose }) => {
  const { mirror, setMirror, resolution } = useCameraStore();
  const {
    threshold,
    setThreshold,
    reset: resetUi,
  } = useUiStore();
  const { activeModel, isSimulated } = useModelStore();

  const handleReset = () => {
    resetUi();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="System Settings"
      side="right"
      width="w-[380px] sm:w-[420px]"
    >
      <div className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[calc(100dvh-56px)] select-none">
        {/* SECTION 1: Camera Ingestion */}
        <Card>
          <CardHeader
            title="Camera Hardware"
            icon={<Camera className="w-3.5 h-3.5 text-text-2" />}
            statusDot={<StatusDot state="idle" />}
          />
          <div className="p-3 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-body text-text-1 font-medium">Mirror Webcam Feed</div>
                <div className="text-small text-text-3">Flip local video horizontally</div>
              </div>
              <Switch checked={mirror} onChange={setMirror} />
            </div>

            <div className="pt-2 border-t border-line-1 flex items-center justify-between text-small">
              <span className="text-text-3">Default Resolution</span>
              <span className="font-mono text-text-2">{resolution.width}×{resolution.height}</span>
            </div>
          </div>
        </Card>

        {/* SECTION 2: Detection Engine */}
        <Card>
          <CardHeader
            title="Detection Engine"
            icon={<Sliders className="w-3.5 h-3.5 text-text-2" />}
            statusDot={<StatusDot state="idle" />}
          />
          <div className="p-3 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-body text-text-1 font-medium">Confidence Cutoff</span>
                <span className="font-mono text-data text-accent">{(threshold * 100).toFixed(0)}%</span>
              </div>
              <Slider
                variant="default"
                surface="card"
                min={0.3}
                max={0.95}
                step={0.05}
                value={threshold}
                onChange={setThreshold}
                minLabel="30%"
                maxLabel="95%"
              />
            </div>

            <div className="pt-2 border-t border-line-1 flex items-center justify-between text-small">
              <span className="text-text-3">Active Model</span>
              <span className="font-mono text-text-2">
                {activeModel?.name || 'yolov8n'} {isSimulated ? '(SIMULATED)' : ''}
              </span>
            </div>
          </div>
        </Card>

        {/* SECTION 3: System Info */}
        <Card>
          <CardHeader
            title="Platform"
            icon={<Sparkles className="w-3.5 h-3.5 text-text-2" />}
            statusDot={<StatusDot state="idle" />}
          />
          <div className="p-3 space-y-2 text-small text-text-3">
            <div className="flex justify-between">
              <span>VISOR Version</span>
              <span className="font-mono text-text-2">v0.1.0</span>
            </div>
            <div className="flex justify-between">
              <span>Inference Runtime</span>
              <span className="font-mono text-text-2">Wasm / Client</span>
            </div>
          </div>
        </Card>

        {/* Reset Actions */}
        <div className="pt-2 flex items-center justify-between">
          <Button
            variant="danger"
            size={32}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleReset}
          >
            Reset Defaults
          </Button>

          <Button
            variant="secondary"
            size={32}
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Drawer>
  );
};
