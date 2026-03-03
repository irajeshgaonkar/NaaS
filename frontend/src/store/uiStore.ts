import { create } from 'zustand';

interface UiState {
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (isOpen: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  mobileSidebarOpen: false,
  setMobileSidebarOpen: (mobileSidebarOpen) => set({ mobileSidebarOpen }),
}));
