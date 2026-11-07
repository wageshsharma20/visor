import React, { useState } from 'react';
import { Play, Square, Activity, Radio } from 'lucide-react';
import { Card, StatusDot, Button, SegmentedControl, Input } from '@/components/ui';
import { ActiveSourceType, useDetectionStore } from '@/stores/detectionStore';
import {
  startDetectionPipeline,
  stopDetectionPipeline,
} from '@/lib/useDetectionPipeline';

export const PipelineDebug: React.FC = () => {
  const {
    pipelineRunning,
    fps,
    totalFrames,
    visibleTracks,
    events,
    latencyMs,
    activeSourceType,
    websocketUrl,
    resetOnSwitch,
    sourceStatus,
    setActiveSourceType,
    setWebsocketUrl,
    setResetOnSwitch,
  } = useDetectionStore();

  const [loading, setLoading] = useState(false);

  const togglePipeline = async () => {
    setLoading(true);
    try {
      if (pipelineRunning) {
        stopDetectionPipeline();
      } else {
        await startDetectionPipeline();
      }
    } finally {
      setLoading(false);
    }
  };

  const latestEvent = events.length > 0 ? events[events.length - 1] : null;

  const sourceOptions: Array<{ label: string; value: ActiveSourceType }> = [
    { label: 'Synthetic', value: 'synthetic' },
    { label: 'Recorded', value: 'recorded' },
    { label: 'WebSocket', value: 'websocket' },
  ];

  return (
    <Card className="flex flex-col shrink-0 p-3 bg-bg-2 border border-line-1 select-none space-y-3">
      {/* Header with Run/Stop */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-line-1">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-accent" />
          <span className="text-small-strong text-text-1">Pipeline Engine</span>
          <StatusDot state={pipelineRunning ? 'live' : 'idle'} />
        </div>
        <Button
          variant="secondary"
          size={32}
          onClick={togglePipeline}
          disabled={loading}
          className="h-7 text-small px-2"
        >
          {pipelineRunning ? (
            <>
              <Square className="w-3 h-3 text-status-critical mr-1.5 fill-current" />
              Stop Scene
            </>
          ) : (
            <>
              <Play className="w-3 h-3 text-status-live mr-1.5 fill-current" />
              Run Demo Scene
            </>
          )}
        </Button>
      </div>

      {/* Source Selector per Review Finding 1 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-small">
          <div className="flex items-center gap-1.5 text-text-2">
            <Radio className="w-3 h-3 text-text-3" />
            <span>Active Source</span>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-text-3 hover:text-text-2">
            <input
              type="checkbox"
              checked={resetOnSwitch}
              onChange={(e) => setResetOnSwitch(e.target.checked)}
              className="w-3 h-3 rounded-chip accent-accent bg-bg-3 border-line-1"
            />
            <span>Reset on switch</span>
          </label>
        </div>

        <SegmentedControl
          value={activeSourceType}
          onChange={(val) => setActiveSourceType(val as ActiveSourceType)}
          options={sourceOptions}
        />

        {activeSourceType === 'websocket' && (
          <div className="pt-1">
            <Input
              value={websocketUrl}
              onChange={(e) => setWebsocketUrl(e.target.value)}
              placeholder="wss://localhost:8765"
              className="h-7 text-data font-mono"
            />
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-data">
        <div className="bg-bg-3/80 border border-line-1 rounded-control p-2">
          <div className="text-text-3 text-small uppercase tracking-wider mb-0.5">Throughput</div>
          <div className="text-text-1 font-semibold">
            {pipelineRunning ? `${fps} fps` : '0 fps'}
          </div>
          <div className="text-text-3 text-small">{totalFrames} frames</div>
        </div>

        <div className="bg-bg-3/80 border border-line-1 rounded-control p-2">
          <div className="text-text-3 text-small uppercase tracking-wider mb-0.5">Latency</div>
          <div className="text-text-1 font-semibold">
            {pipelineRunning ? `${latencyMs} ms` : '—'}
          </div>
          <div className="text-text-3 text-small">
            {sourceStatus.state === 'error' ? 'error' : activeSourceType}
          </div>
        </div>

        <div className="bg-bg-3/80 border border-line-1 rounded-control p-2">
          <div className="text-text-3 text-small uppercase tracking-wider mb-0.5">Active Tracks</div>
          <div className="text-text-1 font-semibold">
            {visibleTracks.length} active
          </div>
          <div className="text-text-3 text-small">in view</div>
        </div>

        <div className="bg-bg-3/80 border border-line-1 rounded-control p-2">
          <div className="text-text-3 text-small uppercase tracking-wider mb-0.5">Events Logged</div>
          <div className="text-text-1 font-semibold">
            {events.length}
          </div>
          <div className="text-text-3 text-small truncate">
            {latestEvent ? `${latestEvent.type}` : 'none'}
          </div>
        </div>
      </div>
    </Card>
  );
};
