import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Layers,
  ShieldAlert,
  Clock,
  ArrowRight,
  Radio,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader, StatusDot, Button } from '@/components/ui';
import { useCameraStore } from '@/stores/cameraStore';
import { useModelStore } from '@/stores/modelStore';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { status: cameraStatus, mode } = useCameraStore();
  const { activeModel, sourceLabel } = useModelStore();

  const isLive = cameraStatus === 'connected';

  const stats = [
    {
      title: 'Active Tracks',
      value: '0',
      delta: 'No tracks currently in frame',
      icon: <Activity className="w-4 h-4 text-accent" />,
      dot: 'idle' as const,
    },
    {
      title: 'Total Detections',
      value: '0',
      delta: 'Session total across all classes',
      icon: <Layers className="w-4 h-4 text-text-2" />,
      dot: 'idle' as const,
    },
    {
      title: 'Flagged Events',
      value: '0',
      delta: 'Watchlist security triggers',
      icon: <ShieldAlert className="w-4 h-4 text-amber" />,
      dot: 'idle' as const,
    },
    {
      title: 'Session Uptime',
      value: '00:00:00',
      delta: 'Telemetry stream duration',
      icon: <Clock className="w-4 h-4 text-text-2" />,
      dot: isLive ? ('live' as const) : ('idle' as const),
    },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto w-full pb-16 sm:pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-title text-text-1 font-semibold">Mission Overview</h1>
          <p className="text-small text-text-3">
            Real-time aggregate telemetry and session diagnostics.
          </p>
        </div>
        <Button
          variant="primary"
          size={32}
          icon={<Radio className="w-3.5 h-3.5" />}
          onClick={() => navigate('/live')}
        >
          Open Live Monitor →
        </Button>
      </div>

      {/* 4 Stat Tiles per DESIGN.md §7 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.title}>
            <CardHeader
              title={s.title}
              icon={s.icon}
              statusDot={<StatusDot state={s.dot} />}
            />
            <div className="p-3 pt-1">
              <div className="font-mono text-metric text-text-1 font-medium">{s.value}</div>
              <div className="text-small text-text-3 mt-1">{s.delta}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Grid: Mini Live Viewport + Source/Model Status + Last Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Viewport Preview Tile (Links to /live) */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          <CardHeader
            title="Live Viewport Feed"
            icon={<Radio className="w-3.5 h-3.5 text-text-2" />}
            statusDot={<StatusDot state={isLive ? 'live' : 'idle'} />}
            action={
              <button
                type="button"
                onClick={() => navigate('/live')}
                className="text-data text-accent hover:underline flex items-center gap-1 focus-visible:outline-none"
              >
                <span>Live Monitor</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            }
          />
          <div
            onClick={() => navigate('/live')}
            className="p-4 bg-bg-0 flex-1 min-h-[200px] flex flex-col items-center justify-center text-center cursor-pointer group relative border-t border-line-1"
          >
            <div className="w-9 h-9 rounded-control bg-bg-2 border border-line-2 flex items-center justify-center text-text-2 group-hover:text-accent transition-colors duration-fast mb-2">
              <Radio className="w-4 h-4" />
            </div>
            <div className="text-body-strong text-text-1">
              {isLive ? `Live Feed Active (${mode})` : 'Camera Feed Offline'}
            </div>
            <div className="text-small text-text-3 max-w-xs mt-1">
              Click to inspect bounding overlays, inline telemetry, and camera HUD on the Live Monitor.
            </div>
          </div>
        </Card>

        {/* Source & Model Status Card */}
        <Card className="flex flex-col">
          <CardHeader
            title="Active Pipeline Configuration"
            icon={<Sparkles className="w-3.5 h-3.5 text-text-2" />}
            statusDot={<StatusDot state="idle" />}
          />
          <div className="p-3 space-y-3">
            <div>
              <div className="text-label text-text-2 mb-1.5">Source Provider</div>
              <div className="p-2.5 rounded-control bg-bg-3 border border-line-1 flex items-center justify-between text-data font-mono">
                <span className="text-text-1">{sourceLabel}</span>
                <StatusDot state={isLive ? 'live' : 'idle'} />
              </div>
            </div>

            <div>
              <div className="text-label text-text-2 mb-1.5">Model Runtime</div>
              <div className="p-2.5 rounded-control bg-bg-3 border border-line-1 flex items-center justify-between text-data font-mono">
                <span className="text-text-1">
                  {activeModel ? `${activeModel.name} · ${activeModel.runtime}` : 'No model deployed'}
                </span>
                <StatusDot state={activeModel ? 'live' : 'idle'} />
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="secondary"
                size={32}
                className="w-full"
                onClick={() => navigate('/models')}
              >
                Configure Pipeline Models →
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Class Distribution & Recent Events Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Class Distribution Card */}
        <Card>
          <CardHeader
            title="Class Breakdown"
            icon={<Layers className="w-3.5 h-3.5 text-text-2" />}
            statusDot={<StatusDot state="idle" />}
          />
          <div className="p-3 space-y-2">
            {[
              { label: 'Person', color: 'var(--class-person)', count: 0 },
              { label: 'Vehicle', color: 'var(--class-vehicle)', count: 0 },
              { label: 'Bag / Backpack', color: 'var(--class-bag)', count: 0 },
              { label: 'Animal', color: 'var(--class-animal)', count: 0 },
            ].map((cls) => (
              <div key={cls.label} className="space-y-1">
                <div className="flex justify-between text-data font-mono">
                  <span className="text-text-2">{cls.label}</span>
                  <span className="text-text-3">{cls.count}</span>
                </div>
                <div className="h-1.5 w-full bg-bg-3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${cls.count}%`, backgroundColor: cls.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Last Events Card */}
        <Card>
          <CardHeader
            title="Recent Telemetry Events"
            icon={<Clock className="w-3.5 h-3.5 text-text-2" />}
            statusDot={<StatusDot state="idle" />}
          />
          <div className="p-6 flex flex-col items-center justify-center text-center">
            <div className="text-small text-text-3">
              No tracking events registered in this session.
            </div>
            <p className="text-data text-text-3 mt-1 max-w-xs">
              When detections enter, get occluded, or trigger watchlist rules, they will appear here.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
