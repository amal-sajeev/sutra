import { create } from 'zustand';
import type { ThemeMode, RightPanelView } from '../types';

interface UIState {
  theme: ThemeMode;
  sidebarOpen: boolean;
  rightPanel: RightPanelView;
  rightPanelWidth: number;
  rightPanelMaximized: boolean;
  quickCaptureOpen: boolean;
  focusMode: boolean;
  typewriterMode: boolean;
  splitEditor: boolean;
  digitalRain: boolean;
  zenMode: boolean;

  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setRightPanel: (view: RightPanelView) => void;
  setRightPanelWidth: (width: number) => void;
  toggleRightPanelMaximized: () => void;
  setQuickCaptureOpen: (open: boolean) => void;
  toggleQuickCapture: () => void;
  setFocusMode: (on: boolean) => void;
  setTypewriterMode: (on: boolean) => void;
  setSplitEditor: (on: boolean) => void;
  setDigitalRain: (on: boolean) => void;
  setZenMode: (on: boolean) => void;
}

const savedTheme = (localStorage.getItem('sutra-theme') as ThemeMode) || 'lain';

export const useUIStore = create<UIState>((set) => ({
  theme: savedTheme,
  sidebarOpen: true,
  rightPanel: 'none',
  rightPanelWidth: 380,
  rightPanelMaximized: false,
  quickCaptureOpen: false,
  focusMode: false,
  typewriterMode: false,
  splitEditor: false,
  digitalRain: true,
  zenMode: false,

  setTheme: (theme) => {
    localStorage.setItem('sutra-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const newTheme = state.theme === 'lain' ? 'matrix' : 'lain';
      localStorage.setItem('sutra-theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      return { theme: newTheme };
    });
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setRightPanel: (view) => set({ rightPanel: view }),
  setRightPanelWidth: (width) => set({ rightPanelWidth: Math.max(280, Math.min(800, width)) }),
  toggleRightPanelMaximized: () => set((s) => ({ rightPanelMaximized: !s.rightPanelMaximized })),
  setQuickCaptureOpen: (open) => set({ quickCaptureOpen: open }),
  toggleQuickCapture: () => set((s) => ({ quickCaptureOpen: !s.quickCaptureOpen })),
  setFocusMode: (on) => set({ focusMode: on }),
  setTypewriterMode: (on) => set({ typewriterMode: on }),
  setSplitEditor: (on) => set({ splitEditor: on }),
  setDigitalRain: (on) => set({ digitalRain: on }),
  setZenMode: (on) => set({ zenMode: on, focusMode: on }),
}));
