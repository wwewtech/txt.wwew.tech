"use client";

import * as React from "react";

import { UI_PREFS_KEY, defaultSettings } from "../model/page-constants";
import type { Language, SortMode, ViewMode } from "../model/page-types";
import { loadHistoryStorage, saveHistoryStorage } from "../store/history-storage";
import { useFilesStore } from "../store/use-files-store";
import { useUIStore } from "../store/use-ui-store";

interface UseHomeRuntimeEffectsInput {
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
  prompt: string;
}

export function useHomeRuntimeEffects({ composerRef, prompt }: UseHomeRuntimeEffectsInput) {
  const mounted = useUIStore((state) => state.mounted);
  const setMounted = useUIStore((state) => state.setMounted);
  const history = useUIStore((state) => state.history);
  const setHistory = useUIStore((state) => state.setHistory);
  const anonymousMode = useUIStore((state) => state.anonymousMode);
  const setAnonymousMode = useUIStore((state) => state.setAnonymousMode);
  const language = useUIStore((state) => state.language);
  const setLanguage = useUIStore((state) => state.setLanguage);
  const rightSidebarWidth = useUIStore((state) => state.rightSidebarWidth);
  const setRightSidebarWidth = useUIStore((state) => state.setRightSidebarWidth);
  const autoSaveEnabled = useUIStore((state) => state.autoSaveEnabled);
  const setAutoSaveEnabled = useUIStore((state) => state.setAutoSaveEnabled);
  const resizingSidebar = useUIStore((state) => state.resizingSidebar);
  const setResizingSidebar = useUIStore((state) => state.setResizingSidebar);
  const setOpenHistoryMenuId = useUIStore((state) => state.setOpenHistoryMenuId);
  const markdownEnabled = useUIStore((state) => state.markdownEnabled);
  const setMarkdownEnabled = useUIStore((state) => state.setMarkdownEnabled);
  const uiScale = useUIStore((state) => state.uiScale);
  const setUiScale = useUIStore((state) => state.setUiScale);
  const compactMode = useUIStore((state) => state.compactMode);
  const setCompactMode = useUIStore((state) => state.setCompactMode);
  const fontSizeOffset = useUIStore((state) => state.fontSizeOffset);
  const setFontSizeOffset = useUIStore((state) => state.setFontSizeOffset);
  const settings = useUIStore((state) => state.settings);
  const setSettings = useUIStore((state) => state.setSettings);
  const systemCommands = useUIStore((state) => state.systemCommands);
  const setSystemCommands = useUIStore((state) => state.setSystemCommands);
  const viewMode = useFilesStore((state) => state.viewMode);
  const setViewMode = useFilesStore((state) => state.setViewMode);
  const sortMode = useFilesStore((state) => state.sortMode);
  const setSortMode = useFilesStore((state) => state.setSortMode);

  React.useEffect(() => {
    setMounted(true);
  }, [setMounted]);

  React.useEffect(() => {
    let active = true;

    const hydrateHistory = async () => {
      try {
        const parsed = await loadHistoryStorage();
        if (!active) return;
        setHistory(parsed);
      } catch {
        if (!active) return;
        setHistory([]);
      }
    };

    void hydrateHistory();

    return () => {
      active = false;
    };
  }, [setHistory]);

  React.useEffect(() => {
    const raw = window.localStorage.getItem(UI_PREFS_KEY);
    if (!raw) {
      const detected = navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
      setLanguage(detected);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        language?: Language;
        rightSidebarWidth?: number;
        autoSaveEnabled?: boolean;
        markdownEnabled?: boolean;
        anonymousMode?: boolean;
        uiScale?: number;
        compactMode?: boolean;
        fontSizeOffset?: number;
        viewMode?: ViewMode;
        sortMode?: SortMode;
        settings?: typeof defaultSettings;
        systemCommands?: unknown;
      };
      if (parsed.language) setLanguage(parsed.language);
      if (typeof parsed.rightSidebarWidth === "number") {
        setRightSidebarWidth(Math.min(520, Math.max(280, parsed.rightSidebarWidth)));
      }
      if (typeof parsed.autoSaveEnabled === "boolean") {
        setAutoSaveEnabled(parsed.autoSaveEnabled);
      }
      if (typeof parsed.markdownEnabled === "boolean") {
        setMarkdownEnabled(parsed.markdownEnabled);
      }
      if (typeof parsed.anonymousMode === "boolean") {
        setAnonymousMode(parsed.anonymousMode);
      }
      if (typeof parsed.uiScale === "number") {
        setUiScale(Math.min(150, Math.max(75, parsed.uiScale)));
      }
      if (typeof parsed.compactMode === "boolean") {
        setCompactMode(parsed.compactMode);
      }
      if (typeof parsed.fontSizeOffset === "number") {
        setFontSizeOffset(Math.min(4, Math.max(-2, parsed.fontSizeOffset)));
      }
      if (parsed.viewMode === "cards" || parsed.viewMode === "compact") {
        setViewMode(parsed.viewMode);
      }
      if (parsed.sortMode) {
        setSortMode(parsed.sortMode);
      }
      if (parsed.settings && typeof parsed.settings === "object") {
        setSettings((prev) => ({ ...prev, ...parsed.settings }));
      }
      if (Array.isArray(parsed.systemCommands)) {
        setSystemCommands(parsed.systemCommands as string[]);
      }
    } catch {
      const detected = navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
      setLanguage(detected);
    }
  }, [setAutoSaveEnabled, setLanguage, setRightSidebarWidth, setMarkdownEnabled, setAnonymousMode, setUiScale, setCompactMode, setFontSizeOffset, setViewMode, setSortMode, setSettings]);

  React.useEffect(() => {
    if (anonymousMode) return;
    void saveHistoryStorage(history);
  }, [history, anonymousMode]);

  React.useEffect(() => {
    window.localStorage.setItem(
      UI_PREFS_KEY,
      JSON.stringify({ language, rightSidebarWidth, autoSaveEnabled, markdownEnabled, anonymousMode, uiScale, compactMode, fontSizeOffset, viewMode, sortMode, settings, systemCommands })
    );
  }, [language, rightSidebarWidth, autoSaveEnabled, markdownEnabled, anonymousMode, uiScale, compactMode, fontSizeOffset, viewMode, sortMode, settings, systemCommands]);

  // Apply UI scale as CSS custom property
  React.useEffect(() => {
    document.documentElement.style.setProperty("--ui-scale", String(uiScale / 100));
  }, [uiScale]);

  // Compact mode class
  React.useEffect(() => {
    if (compactMode) {
      document.documentElement.classList.add("compact");
    } else {
      document.documentElement.classList.remove("compact");
    }
  }, [compactMode]);

  React.useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  React.useEffect(() => {
    if (resizingSidebar !== "right") return;

    const onMove = (event: MouseEvent) => {
      const next = window.innerWidth - event.clientX;
      setRightSidebarWidth(Math.min(520, Math.max(280, next)));
    };

    const onUp = () => setResizingSidebar(null);

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      const next = window.innerWidth - touch.clientX;
      setRightSidebarWidth(Math.min(520, Math.max(280, next)));
    };

    const onTouchEnd = () => setResizingSidebar(null);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [resizingSidebar, setResizingSidebar, setRightSidebarWidth]);

  React.useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-history-item]")) {
        setOpenHistoryMenuId(null);
      }
    };

    window.addEventListener("click", handleOutside);
    return () => window.removeEventListener("click", handleOutside);
  }, [setOpenHistoryMenuId]);

  React.useEffect(() => {
    const element = composerRef.current;
    if (!element) return;
    element.style.height = "0px";
    const next = Math.min(220, Math.max(56, element.scrollHeight));
    element.style.height = `${next}px`;
  }, [prompt, composerRef]);

  return { mounted };
}
