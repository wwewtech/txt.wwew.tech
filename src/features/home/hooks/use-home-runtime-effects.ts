"use client";

import * as React from "react";

import { UI_PREFS_KEY } from "../model/page-constants";
import type { Language } from "../model/page-types";
import { loadHistoryStorage, saveHistoryStorage } from "../store/history-storage";
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
  const language = useUIStore((state) => state.language);
  const setLanguage = useUIStore((state) => state.setLanguage);
  const rightSidebarWidth = useUIStore((state) => state.rightSidebarWidth);
  const setRightSidebarWidth = useUIStore((state) => state.setRightSidebarWidth);
  const autoSaveEnabled = useUIStore((state) => state.autoSaveEnabled);
  const setAutoSaveEnabled = useUIStore((state) => state.setAutoSaveEnabled);
  const resizingSidebar = useUIStore((state) => state.resizingSidebar);
  const setResizingSidebar = useUIStore((state) => state.setResizingSidebar);
  const setOpenHistoryMenuId = useUIStore((state) => state.setOpenHistoryMenuId);

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
      const parsed = JSON.parse(raw) as { language?: Language; rightSidebarWidth?: number; autoSaveEnabled?: boolean };
      if (parsed.language) setLanguage(parsed.language);
      if (typeof parsed.rightSidebarWidth === "number") {
        setRightSidebarWidth(Math.min(520, Math.max(280, parsed.rightSidebarWidth)));
      }
      if (typeof parsed.autoSaveEnabled === "boolean") {
        setAutoSaveEnabled(parsed.autoSaveEnabled);
      }
    } catch {
      const detected = navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
      setLanguage(detected);
    }
  }, [setAutoSaveEnabled, setLanguage, setRightSidebarWidth]);

  React.useEffect(() => {
    if (anonymousMode) return;
    void saveHistoryStorage(history);
  }, [history, anonymousMode]);

  React.useEffect(() => {
    window.localStorage.setItem(
      UI_PREFS_KEY,
      JSON.stringify({ language, rightSidebarWidth, autoSaveEnabled })
    );
  }, [language, rightSidebarWidth, autoSaveEnabled]);

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

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
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
