import { create } from 'zustand';
import type { ParsedItem } from '@/lib';
import type { SortMode, ViewMode } from '../model/page-types';

interface FilesState {
  items: ParsedItem[];
  setItems: (items: ParsedItem[] | ((prev: ParsedItem[]) => ParsedItem[])) => void;
  activePreview: ParsedItem | null;
  setActivePreview: (item: ParsedItem | null | ((prev: ParsedItem | null) => ParsedItem | null)) => void;
  isParsing: boolean;
  setIsParsing: (isParsing: boolean) => void;
  bundleFilter: string;
  setBundleFilter: (filter: string) => void;
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  selectedItemIds: string[];
  setSelectedItemIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  favoriteItemIds: string[];
  setFavoriteItemIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  showSkippedFiles: boolean;
  setShowSkippedFiles: (show: boolean) => void;
  processing: boolean;
  setProcessing: (processing: boolean) => void;
}

export const useFilesStore = create<FilesState>((set) => ({
  items: [],
  setItems: (items) => set((state) => ({ items: typeof items === 'function' ? items(state.items) : items })),
  activePreview: null,
  setActivePreview: (activePreview) => set((state) => ({
    activePreview: typeof activePreview === 'function' ? activePreview(state.activePreview) : activePreview,
  })),
  isParsing: false,
  setIsParsing: (isParsing) => set({ isParsing }),
  bundleFilter: '',
  setBundleFilter: (bundleFilter) => set({ bundleFilter }),
  sortMode: 'latest',
  setSortMode: (sortMode) => set({ sortMode }),
  viewMode: 'cards',
  setViewMode: (viewMode) => set({ viewMode }),
  selectedItemIds: [],
  setSelectedItemIds: (selectedItemIds) => set((state) => ({ 
    selectedItemIds: typeof selectedItemIds === 'function' ? selectedItemIds(state.selectedItemIds) : selectedItemIds 
  })),
  favoriteItemIds: [],
  setFavoriteItemIds: (favoriteItemIds) => set((state) => ({
    favoriteItemIds: typeof favoriteItemIds === 'function' ? favoriteItemIds(state.favoriteItemIds) : favoriteItemIds
  })),
  showSkippedFiles: true,
  setShowSkippedFiles: (showSkippedFiles) => set({ showSkippedFiles }),
  processing: false,
  setProcessing: (processing) => set({ processing }),
}));

export function resetFilesStore() {
  useFilesStore.setState({
    items: [],
    activePreview: null,
    isParsing: false,
    bundleFilter: "",
    sortMode: "latest",
    viewMode: "cards",
    selectedItemIds: [],
    favoriteItemIds: [],
    showSkippedFiles: true,
    processing: false,
  });
}
