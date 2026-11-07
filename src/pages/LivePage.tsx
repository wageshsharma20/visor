import React from 'react';
import { PipelineStrip } from '@/components/live/PipelineStrip';
import { ViewportCard } from '@/components/live/ViewportCard';
import { FloatingToolbar } from '@/components/live/FloatingToolbar';
import { TimelineCard } from '@/components/live/TimelineCard';
import { PipelineDebug } from '@/components/live/PipelineDebug';
import { IntelPanel } from '@/components/intel/IntelPanel';
import { SegmentedControl, Card, CardHeader, StatusDot } from '@/components/ui';
import { useUiStore, MobileIntelTab } from '@/stores/uiStore';
import { Crosshair, ListFilter, EyeOff } from 'lucide-react';

export const LivePage: React.FC = () => {
  const { mobileIntelTab, setMobileIntelTab } = useUiStore();

  const mobileTabs: Array<{ label: string; value: MobileIntelTab }> = [
    { label: 'Current', value: 'current' },
    { label: 'Recent', value: 'recent' },
    { label: 'Timeline', value: 'timeline' },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 h-full overflow-hidden">
      {/* Center Column: Pipeline Strip + Viewport + Floating Toolbar + Timeline */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 sm:gap-4 h-full overflow-y-auto sm:overflow-hidden pb-16 sm:pb-0">
        {/* Row 1: Pipeline Strip (40px) */}
        <PipelineStrip />

        {/* Row 2: Camera Viewport Card (Hero element, 1fr) */}
        <ViewportCard />

        {/* Row 3: Floating Toolbar (48px) */}
        <FloatingToolbar />

        {/* Temporary Pipeline Debug for Phase 3 */}
        <PipelineDebug />

        {/* Desktop / Tablet Timeline (≥ 640px) */}
        <div className="hidden sm:block">
          <TimelineCard />
        </div>

        {/* Mobile Tabbed Views (< 640px): Segmented [Current · Recent · Timeline] */}
        <div className="sm:hidden flex flex-col gap-3">
          <div className="flex justify-center">
            <SegmentedControl
              value={mobileIntelTab}
              onChange={(val) => setMobileIntelTab(val as MobileIntelTab)}
              options={mobileTabs}
            />
          </div>

          {mobileIntelTab === 'timeline' && <TimelineCard />}

          {mobileIntelTab === 'current' && (
            <Card className="flex flex-col">
              <CardHeader
                title="Current Detection"
                icon={<Crosshair className="w-3.5 h-3.5 text-text-2" />}
                statusDot={<StatusDot state="idle" />}
              />
              <div className="p-3">
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
          )}

          {mobileIntelTab === 'recent' && (
            <Card className="flex flex-col min-h-[180px]">
              <CardHeader
                title="Recent Detections"
                icon={<ListFilter className="w-3.5 h-3.5 text-text-2" />}
                statusDot={
                  <span className="font-mono text-data text-text-3 px-1.5 py-0.5 rounded-chip bg-bg-3 border border-line-1">
                    0
                  </span>
                }
              />
              <div className="p-4 flex flex-col items-center justify-center text-center">
                <div className="text-small text-text-3">
                  No objects detected in the current session.
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Right Column (Desktop: fixed width; Tablet: drawer) */}
      <IntelPanel />
    </div>
  );
};
