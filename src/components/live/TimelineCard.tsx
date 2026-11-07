import React from 'react';
import { Clock } from 'lucide-react';
import { Card, CardHeader, SegmentedControl, StatusDot } from '@/components/ui';
import { useUiStore, TimeWindow } from '@/stores/uiStore';

export const TimelineCard: React.FC = () => {
  const { timeWindow, setTimeWindow } = useUiStore();

  const timeOptions: Array<{ label: string; value: TimeWindow }> = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
  ];

  return (
    <Card className="h-timeline flex flex-col shrink-0 select-none overflow-hidden">
      <CardHeader
        title="Detection Timeline"
        icon={<Clock className="w-3.5 h-3.5 text-text-2" />}
        statusDot={<StatusDot state="idle" />}
        action={
          <div className="flex items-center gap-2">
            <span className="font-mono text-data text-text-3 px-1.5 py-0.5 rounded-chip bg-bg-3 border border-line-1">
              0 events
            </span>
            <SegmentedControl
              value={timeWindow}
              onChange={(val) => setTimeWindow(val as TimeWindow)}
              options={timeOptions}
            />
          </div>
        }
      />

      {/* Timeline Graphic Area with Lanes and Empty State */}
      <div className="relative flex-1 min-h-0 flex flex-col justify-between p-3">
        {/* Lanes */}
        <div className="space-y-1.5 opacity-40">
          {['Person', 'Vehicle', 'Bag', 'Animal'].map((cls) => (
            <div key={cls} className="flex items-center gap-3 text-data font-mono">
              <span className="w-16 text-text-3 text-right shrink-0">{cls}</span>
              <div className="flex-1 h-3 rounded-full bg-bg-3 border border-line-1 relative overflow-hidden" />
            </div>
          ))}
        </div>

        {/* Center Empty State Message */}
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <div className="px-3 py-1.5 rounded-chip bg-bg-2 border border-line-2 text-small text-text-3 shadow-float">
            No detections recorded yet · Start camera or demo scene
          </div>
        </div>

        {/* Axis & "Now" line */}
        <div className="flex items-center justify-between pt-1 border-t border-line-1 text-data font-mono text-text-3">
          <span>-5:00</span>
          <span>-3:45</span>
          <span>-2:30</span>
          <span>-1:15</span>
          <span className="text-accent flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            NOW
          </span>
        </div>
      </div>
    </Card>
  );
};
