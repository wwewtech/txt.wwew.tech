import { create } from 'zustand';
import { defaultSettings } from '../model/page-constants';
import type { EditDialogState, Language, ActivityItem, HistoryItem } from '../model/page-types';

interface UIState {
  leftCollapsed: boolean;
  setLeftCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  mobileLeftOpen: boolean;
  setMobileLeftOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  mobileRightOpen: boolean;
  setMobileRightOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  uiScale: number;
  setUiScale: (scale: number) => void;
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
  fontSizeOffset: number;
  setFontSizeOffset: (offset: number) => void;
  anonymousMode: boolean;
  setAnonymousMode: (anonymous: boolean) => void;
  history: HistoryItem[];
  setHistory: (history: HistoryItem[] | ((prev: HistoryItem[]) => HistoryItem[])) => void;
  openHistoryMenuId: string | null;
  setOpenHistoryMenuId: (id: string | null | ((prev: string | null) => string | null)) => void;
  settings: typeof defaultSettings;
  setSettings: (settings: typeof defaultSettings | ((prev: typeof defaultSettings) => typeof defaultSettings)) => void;
  mounted: boolean;
  setMounted: (mounted: boolean) => void;
  rightSidebarOpen: boolean;
  setRightSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  activity: ActivityItem[];
  setActivity: (activity: ActivityItem[] | ((prev: ActivityItem[]) => ActivityItem[])) => void;
  rightSidebarWidth: number;
  setRightSidebarWidth: (width: number) => void;
  resizingSidebar: null | 'right';
  setResizingSidebar: (resizing: null | 'right') => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  markdownEnabled: boolean;
  setMarkdownEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  autoSaveEnabled: boolean;
  setAutoSaveEnabled: (enabled: boolean | ((prev: boolean) => boolean)) => void;
  editDialog: EditDialogState | null;
  setEditDialog: (dialog: EditDialogState | null | ((prev: EditDialogState | null) => EditDialogState | null)) => void;
}

export const useUIStore = create<UIState>((set) => ({
  leftCollapsed: false,
  setLeftCollapsed: (val) => set((s) => ({ leftCollapsed: typeof val === 'function' ? val(s.leftCollapsed) : val })),
  mobileLeftOpen: false,
  setMobileLeftOpen: (val) => set((s) => ({ mobileLeftOpen: typeof val === 'function' ? val(s.mobileLeftOpen) : val })),
  mobileRightOpen: false,
  setMobileRightOpen: (val) => set((s) => ({ mobileRightOpen: typeof val === 'function' ? val(s.mobileRightOpen) : val })),
  uiScale: 100,
  setUiScale: (uiScale) => set({ uiScale }),
  compactMode: false,
  setCompactMode: (compactMode) => set({ compactMode }),
  fontSizeOffset: 0,
  setFontSizeOffset: (fontSizeOffset) => set({ fontSizeOffset }),
  anonymousMode: false,
  setAnonymousMode: (anonymousMode) => set({ anonymousMode }),
  history: [],
  setHistory: (val) => set((s) => ({ history: typeof val === 'function' ? val(s.history) : val })),
  openHistoryMenuId: null,
  setOpenHistoryMenuId: (val) => set((s) => ({
    openHistoryMenuId: typeof val === 'function' ? val(s.openHistoryMenuId) : val,
  })),
  settings: defaultSettings,
  setSettings: (val) => set((s) => ({ settings: typeof val === 'function' ? val(s.settings) : val })),
  mounted: false,
  setMounted: (mounted) => set({ mounted }),
  rightSidebarOpen: true,
  setRightSidebarOpen: (val) => set((s) => ({ rightSidebarOpen: typeof val === 'function' ? val(s.rightSidebarOpen) : val })),
  activity: [],
  setActivity: (val) => set((s) => ({ activity: typeof val === 'function' ? val(s.activity) : val })),
  rightSidebarWidth: 320,
  setRightSidebarWidth: (rightSidebarWidth) => set({ rightSidebarWidth }),
  resizingSidebar: null,
  setResizingSidebar: (resizingSidebar) => set({ resizingSidebar }),
  language: 'ru',
  setLanguage: (language) => set({ language }),
  markdownEnabled: true,
  setMarkdownEnabled: (val) => set((s) => ({ markdownEnabled: typeof val === 'function' ? val(s.markdownEnabled) : val })),
  autoSaveEnabled: true,
  setAutoSaveEnabled: (val) => set((s) => ({ autoSaveEnabled: typeof val === 'function' ? val(s.autoSaveEnabled) : val })),
  editDialog: null,
  setEditDialog: (val) => set((s) => ({
    editDialog: typeof val === 'function' ? val(s.editDialog) : val,
  })),
}));

export function resetUIStore() {
  useUIStore.setState({
    leftCollapsed: false,
    mobileLeftOpen: false,
    mobileRightOpen: false,
    uiScale: 100,
    compactMode: false,
    fontSizeOffset: 0,
    anonymousMode: false,
    history: [],
    openHistoryMenuId: null,
    settings: defaultSettings,
    mounted: false,
    rightSidebarOpen: true,
    activity: [],
    rightSidebarWidth: 320,
    resizingSidebar: null,
    language: "ru",
    markdownEnabled: true,
    autoSaveEnabled: true,
    editDialog: null,
  });
}
