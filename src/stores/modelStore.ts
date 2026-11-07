import { create } from 'zustand';
import { ModelConfig, ModelDeploymentStatus } from '@/types/model';

export interface ModelState {
  activeModel: ModelConfig | null;
  status: ModelDeploymentStatus;
  endpointUrl: string;
  isSimulated: boolean;
  sourceLabel: string; // e.g. 'NO SOURCE', 'SIMULATED', 'WEBCAM', 'DEMO SCENE'

  setActiveModel: (model: ModelConfig | null) => void;
  setStatus: (status: ModelDeploymentStatus) => void;
  setEndpointUrl: (url: string) => void;
  setIsSimulated: (sim: boolean) => void;
  setSourceLabel: (label: string) => void;
  reset: () => void;
}

const initialState = {
  activeModel: null,
  status: 'not_configured' as ModelDeploymentStatus,
  endpointUrl: '',
  isSimulated: true,
  sourceLabel: 'NO SOURCE',
};

export const useModelStore = create<ModelState>((set) => ({
  ...initialState,
  setActiveModel: (activeModel) => set({ activeModel }),
  setStatus: (status) => set({ status }),
  setEndpointUrl: (endpointUrl) => set({ endpointUrl }),
  setIsSimulated: (isSimulated) => set({ isSimulated }),
  setSourceLabel: (sourceLabel) => set({ sourceLabel }),
  reset: () => set(initialState),
}));
