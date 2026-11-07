import { create } from 'zustand';

export type TimeWindow = '1m' | '5m' | '15m';
export type MobileIntelTab = 'current' | 'recent' | 'timeline';

export interface UiState {
  threshold: number; // 0.30 - 0.95
  showBoxes: boolean;
  showLabels: boolean;
  showTrails: boolean;
  selectedTrackId: string | null;
  autoFollowNewest: boolean;
  timeWindow: TimeWindow;
  isDrawerOpen: boolean;
  isMembersOpen: boolean;
  activeWorkspace: string;
  mobileIntelTab: MobileIntelTab;

  setThreshold: (val: number) => void;
  setShowBoxes: (show: boolean) => void;
  setShowLabels: (show: boolean) => void;
  setShowTrails: (show: boolean) => void;
  setSelectedTrackId: (id: string | null) => void;
  setAutoFollowNewest: (follow: boolean) => void;
  setTimeWindow: (w: TimeWindow) => void;
  setIsDrawerOpen: (open: boolean) => void;
  toggleDrawer: () => void;
  setIsMembersOpen: (open: boolean) => void;
  setActiveWorkspace: (ws: string) => void;
  setMobileIntelTab: (tab: MobileIntelTab) => void;
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
  isMembersOpen: false,
  activeWorkspace: 'Lobby-North',
  mobileIntelTab: 'current' as MobileIntelTab,
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
  setIsMembersOpen: (isMembersOpen) => set({ isMembersOpen }),
  setActiveWorkspace: (activeWorkspace) => set({ activeWorkspace }),
  setMobileIntelTab: (mobileIntelTab) => set({ mobileIntelTab }),
  reset: () => set(initialState),
}));
