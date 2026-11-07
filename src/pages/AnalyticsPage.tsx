import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, TrendingUp, Layers, Radio } from 'lucide-react';
import { Card, CardHeader, StatusDot, Button } from '@/components/ui';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto w-full pb-16 sm:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-title text-text-1 font-semibold">Session Analytics</h1>
          <p className="text-small text-text-3">
            Throughput histograms, class frequency distributions, and confidence analytics.
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

      {/* 3 Chart Cards per DESIGN.md §7 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CHART 1: Detections Per Minute */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader
            title="Detections Per Minute (Rate)"
            icon={<TrendingUp className="w-3.5 h-3.5 text-text-2" />}
            statusDot={<StatusDot state="idle" />}
          />
          <div className="p-4 flex-1 flex flex-col justify-between min-h-[220px]">
            {/* Hand-drawn SVG Chart Area */}
            <div className="relative flex-1 w-full flex items-center justify-center border-b border-line-1 pb-4">
              <svg className="w-full h-32" viewBox="0 0 500 120">
                {/* Horizontal grid lines */}
                <line x1="0" y1="20" x2="500" y2="20" stroke="var(--line-1)" strokeDasharray="4 4" />
                <line x1="0" y1="60" x2="500" y2="60" stroke="var(--line-1)" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="var(--line-1)" strokeDasharray="4 4" />

                {/* Simulated baseline bars */}
                {Array.from({ length: 15 }).map((_, i) => (
                  <rect
                    key={i}
                    x={30 + i * 32}
                    y={118}
                    width={14}
                    height={2}
                    rx={1}
                    fill="var(--bg-3)"
                  />
                ))}
              </svg>

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-3 py-1.5 rounded-chip bg-bg-2 border border-line-2 text-small text-text-3 shadow-float">
                  Awaiting telemetry frames to calculate throughput rate
                </div>
              </div>
            </div>

            {/* X-Axis labels in data text */}
            <div className="flex justify-between pt-2 text-data font-mono text-text-3">
              <span>-15m</span>
              <span>-10m</span>
              <span>-5m</span>
              <span>Now</span>
            </div>
          </div>
        </Card>

        {/* CHART 2: Class Frequency Breakdown */}
        <Card className="flex flex-col">
          <CardHeader
            title="Class Frequency Distribution"
            icon={<Layers className="w-3.5 h-3.5 text-text-2" />}
            statusDot={<StatusDot state="idle" />}
          />
          <div className="p-4 flex-1 flex flex-col justify-center space-y-3">
            {[
              { label: 'Person', color: 'var(--class-person)', pct: 0 },
              { label: 'Vehicle', color: 'var(--class-vehicle)', pct: 0 },
              { label: 'Bag / Luggage', color: 'var(--class-bag)', pct: 0 },
              { label: 'Animal', color: 'var(--class-animal)', pct: 0 },
            ].map((cls) => (
              <div key={cls.label} className="space-y-1">
                <div className="flex justify-between text-data font-mono">
                  <span className="text-text-2">{cls.label}</span>
                  <span className="text-text-3">{cls.pct}%</span>
                </div>
                <div className="h-2 w-full bg-bg-3 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-fast"
                    style={{ width: `${cls.pct}%`, backgroundColor: cls.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* CHART 3: Confidence Score Histogram (10 bins) */}
      <Card>
        <CardHeader
          title="Confidence Score Histogram (10 Bins)"
          icon={<BarChart2 className="w-3.5 h-3.5 text-text-2" />}
          statusDot={<StatusDot state="idle" />}
        />
        <div className="p-4 flex flex-col justify-between min-h-[180px]">
          <div className="relative flex-1 w-full flex items-center justify-center border-b border-line-1 pb-4">
            <svg className="w-full h-28" viewBox="0 0 500 100">
              <line x1="0" y1="20" x2="500" y2="20" stroke="var(--line-1)" strokeDasharray="4 4" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="var(--line-1)" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="var(--line-1)" strokeDasharray="4 4" />

              {/* 10 Bins */}
              {Array.from({ length: 10 }).map((_, i) => (
                <rect
                  key={i}
                  x={25 + i * 46}
                  y={96}
                  width={24}
                  height={4}
                  rx={2}
                  fill="var(--bg-3)"
                />
              ))}
            </svg>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="px-3 py-1.5 rounded-chip bg-bg-2 border border-line-2 text-small text-text-3 shadow-float">
                No confidence distribution data recorded yet
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2 text-data font-mono text-text-3">
            <span>0.0</span>
            <span>0.2</span>
            <span>0.4</span>
            <span>0.6</span>
            <span>0.8</span>
            <span>1.0</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
