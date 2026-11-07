import React from 'react';
import {
  Crosshair,
  Sparkle,
  ListFilter,
  EyeOff,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  StatusDot,
  IconButton,
} from '@/components/ui';
import { PipelineDebug } from '@/components/live/PipelineDebug';

export const IntelContent: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 w-full h-full select-none">
      {/* Temporary Phase 3/4 Debug Card in Intel Panel */}
      <PipelineDebug />

      {/* 1. CURRENT DETECTION CARD */}
      <Card className="flex flex-col shrink-0">
        <CardHeader
          title="Current Detection"
          icon={<Crosshair className="w-3.5 h-3.5 text-text-2" />}
          statusDot={<StatusDot state="idle" />}
        />
        <div className="p-3">
          {/* Empty state per DESIGN.md §6.8 */}
          <div className="flex flex-col items-center justify-center py-6 text-center bg-bg-3/50 border border-line-1 rounded-control">
            <div className="w-8 h-8 rounded-control bg-bg-3 border border-line-2 flex items-center justify-center text-text-3 mb-2">
              <EyeOff className="w-4 h-4" />
            </div>
            <div className="text-body-strong text-text-1 mb-0.5">No Object Selected</div>
            <div className="text-small text-text-3 max-w-[200px]">
              Select an object in the feed or the list.
            </div>
          </div>
        </div>
      </Card>

      {/* 2. AI DESCRIPTION CARD */}
      <Card className="flex flex-col shrink-0">
        <CardHeader
          title="AI Description"
          icon={<Sparkle className="w-3.5 h-3.5 text-text-2" />}
          statusDot={<StatusDot state="idle" />}
        />
        <div className="p-3 space-y-2.5">
          <div className="p-3 bg-bg-3 border border-line-1 rounded-control text-body text-text-3 leading-relaxed min-h-[64px] flex items-center justify-center text-center">
            No description model connected.
          </div>
          {/* Meta-chip row hidden in unavailable state per requirement */}
        </div>
      </Card>

      {/* 3. RECENT DETECTIONS CARD */}
      <Card className="flex flex-col flex-1 min-h-[220px] overflow-hidden">
        <CardHeader
          title="Recent Detections"
          icon={<ListFilter className="w-3.5 h-3.5 text-text-2" />}
          statusDot={
            <span className="font-mono text-data text-text-3 px-1.5 py-0.5 rounded-chip bg-bg-3 border border-line-1">
              0
            </span>
          }
          action={
            <IconButton
              icon={<ListFilter className="w-3.5 h-3.5" />}
              label="Filter classes"
              size={32}
              onClick={() => {}}
            />
          }
        />
        <div className="flex-1 p-3 flex flex-col items-center justify-center text-center overflow-y-auto">
          <div className="text-small text-text-3">
            No objects detected in the current session.
          </div>
        </div>
      </Card>
    </div>
  );
};
