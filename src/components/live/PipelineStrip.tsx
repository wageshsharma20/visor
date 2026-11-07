import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Zap, Crosshair } from 'lucide-react';
import { StatusDot } from '@/components/ui';
import { usePipelineStatus } from '@/stores/pipelineStatus';

export const PipelineStrip: React.FC = () => {
  const navigate = useNavigate();
  const pipeline = usePipelineStatus();

  const isWireStreaming = pipeline.camera === 'live' && pipeline.model === 'running';
  const isModelAmber = pipeline.model === 'running' && pipeline.simulated;

  return (
    <div className="h-pipeline flex items-center justify-start gap-1 sm:gap-2 select-none shrink-0">
      {/* Node 1: Camera Node */}
      <div className="flex items-center gap-2 h-8 px-2 sm:px-2.5 rounded-control bg-bg-2 border border-line-1 text-data font-mono shrink-0">
        <Camera className="w-3.5 h-3.5 text-text-2 shrink-0" />
        <span className="hidden sm:inline text-text-1">
          {pipeline.cameraDisplay}
        </span>
        <StatusDot state={pipeline.camera === 'live' ? 'live' : 'idle'} />
      </div>

      {/* Wire 1: Camera -> Hub */}
      <div className="flex items-center w-3 sm:w-8 shrink-0">
        <svg className="w-full h-4 overflow-visible" viewBox="0 0 32 16">
          <line
            x1="0"
            y1="8"
            x2="32"
            y2="8"
            stroke={isWireStreaming ? 'var(--accent)' : 'var(--line-2)'}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle
            cx="2"
            cy="8"
            r="2.5"
            fill={isWireStreaming ? 'var(--accent-bright)' : 'var(--text-3)'}
          />
          <circle
            cx="30"
            cy="8"
            r="2.5"
            fill={isWireStreaming ? 'var(--accent-bright)' : 'var(--text-3)'}
          />
        </svg>
      </div>

      {/* Node 2: Inference Hub Node */}
      <div
        onClick={() => navigate('/models')}
        title="Configure Model in Model Management"
        className="flex items-center gap-2 h-8 px-2 sm:px-2.5 rounded-control bg-bg-2 border border-line-1 hover:border-line-2 cursor-pointer transition-colors duration-fast text-data font-mono shrink-0 group"
      >
        <div className="w-4 h-4 rounded-chip bg-bg-3 border border-line-2 flex items-center justify-center text-text-1 group-hover:text-accent transition-colors duration-fast shrink-0">
          <Zap className="w-2.5 h-2.5 fill-current" />
        </div>
        <span
          className={`hidden sm:inline truncate max-w-[140px] md:max-w-[200px] ${
            isModelAmber ? 'text-amber font-medium' : pipeline.model === 'running' ? 'text-accent' : 'text-text-1'
          }`}
        >
          {pipeline.modelDisplay}
        </span>
        <StatusDot
          state={isModelAmber ? 'warning' : pipeline.model === 'running' ? 'live' : 'idle'}
        />
      </div>

      {/* Wire 2: Hub -> Tracker */}
      <div className="flex items-center w-3 sm:w-8 shrink-0">
        <svg className="w-full h-4 overflow-visible" viewBox="0 0 32 16">
          <line
            x1="0"
            y1="8"
            x2="32"
            y2="8"
            stroke={isWireStreaming ? 'var(--accent)' : 'var(--line-2)'}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle
            cx="2"
            cy="8"
            r="2.5"
            fill={isWireStreaming ? 'var(--accent-bright)' : 'var(--text-3)'}
          />
          <circle
            cx="30"
            cy="8"
            r="2.5"
            fill={isWireStreaming ? 'var(--accent-bright)' : 'var(--text-3)'}
          />
        </svg>
      </div>

      {/* Node 3: Tracker Output Node */}
      <div className="flex items-center gap-2 h-8 px-2 sm:px-2.5 rounded-control bg-bg-2 border border-line-1 text-data font-mono shrink-0">
        <Crosshair className="w-3.5 h-3.5 text-text-2 shrink-0" />
        <span className="hidden sm:inline text-text-1">Tracker · 0 obj</span>
        <StatusDot state="idle" />
      </div>
    </div>
  );
};
