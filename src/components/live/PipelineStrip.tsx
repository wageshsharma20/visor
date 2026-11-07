import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Zap, Crosshair } from 'lucide-react';
import { StatusDot } from '@/components/ui';
import { useCameraStore } from '@/stores/cameraStore';
import { useModelStore } from '@/stores/modelStore';

export const PipelineStrip: React.FC = () => {
  const navigate = useNavigate();
  const { status: cameraStatus, resolution } = useCameraStore();
  const { activeModel } = useModelStore();

  const isCameraLive = cameraStatus === 'connected';
  const isModelActive = activeModel !== null;

  return (
    <div className="h-pipeline flex items-center justify-start gap-2 select-none overflow-x-auto no-scrollbar shrink-0">
      {/* Node 1: Camera Node */}
      <div className="flex items-center gap-2 h-8 px-2.5 rounded-control bg-bg-2 border border-line-1 text-data font-mono shrink-0">
        <Camera className="w-3.5 h-3.5 text-text-2" />
        <span className="hidden sm:inline text-text-1">
          CAM_01 · {resolution.width}×{resolution.height}
        </span>
        <span className="sm:hidden text-text-1">CAM_01</span>
        <StatusDot state={isCameraLive ? 'live' : 'idle'} />
      </div>

      {/* Wire 1: Camera -> Hub */}
      <div className="flex items-center w-6 sm:w-10 shrink-0">
        <svg className="w-full h-4 overflow-visible" viewBox="0 0 40 16">
          <line
            x1="0"
            y1="8"
            x2="40"
            y2="8"
            stroke="var(--line-2)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="2" cy="8" r="2.5" fill="var(--text-3)" />
          <circle cx="38" cy="8" r="2.5" fill="var(--text-3)" />
        </svg>
      </div>

      {/* Node 2: Inference Hub Node */}
      <div
        onClick={() => navigate('/models')}
        title="Configure Model in Model Management"
        className="flex items-center gap-2 h-8 px-2.5 rounded-control bg-bg-2 border border-line-1 hover:border-line-2 cursor-pointer transition-colors duration-fast text-data font-mono shrink-0 group"
      >
        <div className="w-4 h-4 rounded-chip bg-bg-3 border border-line-2 flex items-center justify-center text-text-1 group-hover:text-accent transition-colors duration-fast">
          <Zap className="w-2.5 h-2.5 fill-current" />
        </div>
        <span className="text-text-1">
          {activeModel ? activeModel.name : 'No model'}
        </span>
        <StatusDot state={isModelActive ? 'live' : 'idle'} />
      </div>

      {/* Wire 2: Hub -> Tracker */}
      <div className="flex items-center w-6 sm:w-10 shrink-0">
        <svg className="w-full h-4 overflow-visible" viewBox="0 0 40 16">
          <line
            x1="0"
            y1="8"
            x2="40"
            y2="8"
            stroke="var(--line-2)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="2" cy="8" r="2.5" fill="var(--text-3)" />
          <circle cx="38" cy="8" r="2.5" fill="var(--text-3)" />
        </svg>
      </div>

      {/* Node 3: Tracker Output Node */}
      <div className="flex items-center gap-2 h-8 px-2.5 rounded-control bg-bg-2 border border-line-1 text-data font-mono shrink-0">
        <Crosshair className="w-3.5 h-3.5 text-text-2" />
        <span className="hidden sm:inline text-text-1">Tracker · 0 objects</span>
        <span className="sm:hidden text-text-1">0 obj</span>
        <StatusDot state="idle" />
      </div>
    </div>
  );
};
