import { create } from 'zustand';

export type TimeWindow = '1m' | '5m' | '15m';

export interface UiState {
  threshold: number; // 0.30 - 0.95
  showBoxes: boolean;
  showLabels: boolean;
  showTrails: boolean;
  selectedTrackId: string | null;
  autoFollowNewest: boolean;
  timeWindow: TimeWindow;
  isDrawerOpen: boolean;
  isSettingsOpen: boolean;

  setThreshold: (val: number) => void;
  setShowBoxes: (show: boolean) => void;
  setShowLabels: (show: boolean) => void;
  setShowTrails: (show: boolean) => void;
  setSelectedTrackId: (id: string | null) => void;
  setAutoFollowNewest: (follow: boolean) => void;
  setTimeWindow: (w: TimeWindow) => void;
  setIsDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  setSettingsOpen: (open: boolean) => void;
  toggleSettings: () => void;
  reset: () => void;
}

const initialState = {
  threshold: 0.5,
  showBoxes: true,
  showLabels: true,
  showTrails: false,
  selectedTrackId: null,
  autoFollowNewest: false,
  timeWindow: '5m' as TimeWindow,
  isDrawerOpen: false,
  isSettingsOpen: false,
};

export const useUiStore = create<UiState>((set) => ({
  ...initialState,
  setThreshold: (threshold) => set({ threshold }),
  setShowBoxes: (showBoxes) => set({ showBoxes }),
  setShowLabels: (showLabels) => set({ showLabels }),
  setShowTrails: (showTrails) => set({ showTrails }),
  setSelectedTrackId: (selectedTrackId) => set({ selectedTrackId }),
  setAutoFollowNewest: (autoFollowNewest) => set({ autoFollowNewest }),
  setTimeWindow: (timeWindow) => set({ timeWindow }),
  setIsDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),
  toggleDrawer: () => set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  setSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  reset: () => set(initialState),
}));
