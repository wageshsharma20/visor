import React, { useState } from 'react';
import {
  Camera,
  Layers,
  RotateCcw,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  Button,
  Select,
  Switch,
  Slider,
  StatusDot,
  Dialog,
} from '@/components/ui';
import { useCameraStore } from '@/stores/cameraStore';
import { useUiStore } from '@/stores/uiStore';

export const SettingsPage: React.FC = () => {
  const { mirror, setMirror, mode, setMode } = useCameraStore();
  const {
    threshold,
    setThreshold,
    showBoxes,
    setShowBoxes,
    showLabels,
    setShowLabels,
    showTrails,
    setShowTrails,
    reset: resetUi,
  } = useUiStore();

  const [historyCap, setHistoryCap] = useState('2000');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const handleResetAll = () => {
    resetUi();
    setResetDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto w-full pb-16 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-title text-text-1 font-semibold">System Settings</h1>
          <p className="text-small text-text-3">
            Hardware preferences, overlay defaults, watchlist rules, and telemetry memory caps.
          </p>
        </div>

        <Button
          variant="danger"
          size={32}
          icon={<RotateCcw className="w-3.5 h-3.5" />}
          onClick={() => setResetDialogOpen(true)}
        >
          Reset All Defaults
        </Button>
      </div>

      {/* CARD 1: Camera & Ingestion Settings */}
      <Card>
        <CardHeader
          title="Camera Ingestion Hardware"
          icon={<Camera className="w-3.5 h-3.5 text-text-2" />}
          statusDot={<StatusDot state="idle" />}
        />
        <div className="p-4 space-y-4">
          <Select
            label="Active Video Input Device"
            value={mode}
            onChange={(val) => setMode(val as 'webcam' | 'demo')}
            options={[
              { label: 'Synthetic Demo Scene (Simulated 1080p)', value: 'demo' },
              { label: 'FaceTime HD Camera (Built-in)', value: 'webcam' },
            ]}
          />

          <div className="flex items-center justify-between py-2 border-t border-line-1">
            <div>
              <div className="text-body font-medium text-text-1">Mirror Webcam Feed</div>
              <div className="text-small text-text-3">
                Inverts horizontal video feed while keeping bounding text readable.
              </div>
            </div>
            <Switch checked={mirror} onChange={setMirror} />
          </div>
        </div>
      </Card>

      {/* CARD 2: Overlay Defaults */}
      <Card>
        <CardHeader
          title="Overlay & Tracking Defaults"
          icon={<Layers className="w-3.5 h-3.5 text-text-2" />}
          statusDot={<StatusDot state="idle" />}
        />
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-line-1">
            <div>
              <div className="text-body font-medium text-text-1">Show Bounding Boxes</div>
              <div className="text-small text-text-3">
                Renders class-colored corner brackets and 1.5px vector rectangles.
              </div>
            </div>
            <Switch checked={showBoxes} onChange={setShowBoxes} />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-line-1">
            <div>
              <div className="text-body font-medium text-text-1">Show HUD Labels</div>
              <div className="text-small text-text-3">
                Attaches uppercase class, tracking ID, and confidence chip above box.
              </div>
            </div>
            <Switch checked={showLabels} onChange={setShowLabels} />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-body font-medium text-text-1">Show Motion Centroid Trails</div>
              <div className="text-small text-text-3">
                Visualizes the last 30 centroid coordinates as fading polyline paths.
              </div>
            </div>
            <Switch checked={showTrails} onChange={setShowTrails} />
          </div>
        </div>
      </Card>

      {/* CARD 3: Thresholds & Ring Buffer Cap */}
      <Card>
        <CardHeader
          title="Thresholds & Telemetry Buffer"
          icon={<Sliders className="w-3.5 h-3.5 text-text-2" />}
          statusDot={<StatusDot state="idle" />}
        />
        <div className="p-4 space-y-4">
          <Slider
            surface="card"
            label="Default Confidence Threshold"
            min={0.3}
            max={0.95}
            step={0.05}
            minLabel="30%"
            maxLabel="95%"
            value={threshold}
            onChange={setThreshold}
          />

          <Select
            label="Telemetry Ring Buffer History Cap"
            value={historyCap}
            onChange={setHistoryCap}
            options={[
              { label: '1,000 entries (low memory)', value: '1000' },
              { label: '2,000 entries (standard)', value: '2000' },
              { label: '5,000 entries (deep audit)', value: '5000' },
            ]}
          />
        </div>
      </Card>

      {/* CARD 4: Watchlist Classes */}
      <Card>
        <CardHeader
          title="Security Watchlist Classes"
          icon={<ShieldAlert className="w-3.5 h-3.5 text-amber" />}
          statusDot={<StatusDot state="warning" />}
        />
        <div className="p-4 space-y-3">
          <p className="text-small text-text-2 leading-relaxed">
            Detections matching these classes trigger flagged events (amber box highlight, amber
            timeline tick, and audit log alerts).
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {['suitcase (unattended >10s)', 'abandoned backpack'].map((w) => (
              <span
                key={w}
                className="px-2.5 py-1 rounded-chip bg-amber/10 border border-amber/30 text-data font-mono text-amber"
              >
                {w}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Reset Confirmation Dialog */}
      <Dialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
        title="Reset All Preferences?"
        description="This will restore all default threshold values, ingestion modes, and overlay settings."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size={32} onClick={() => setResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size={32} onClick={handleResetAll}>
              Reset Defaults
            </Button>
          </div>
        }
      >
        <div className="text-small text-text-3">
          All custom thresholds, watchlist rules, and overlay toggles will be reverted to factory presets.
        </div>
      </Dialog>
    </div>
  );
};
