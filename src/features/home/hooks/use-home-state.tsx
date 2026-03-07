"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

import {
  combineToFinalTxt,
  estimateTokens,
  type ParsedItem,
} from "@/lib";
import { defaultSettings, HISTORY_KEY, i18n, UI_PREFS_KEY } from "../model/page-constants";
import { markdownComponents } from "../ui/markdown-components";
import type {
  ActiveMode,
  ActivityItem,
  ChatMessage,
  ContextGroup,
  EditDialogState,
  HistoryItem,
  Language,
  SortMode,
  TimelineEntry,
  ViewMode,
} from "../model/page-types";

export function useHomeState() {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const folderInputRef = React.useRef<HTMLInputElement | null>(null);
  const composerRef = React.useRef<HTMLTextAreaElement | null>(null);

  const [leftCollapsed, setLeftCollapsed] = React.useState(false);
  const [anonymousMode, setAnonymousMode] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [items, setItems] = React.useState<ParsedItem[]>([]);
  const [activePreview, setActivePreview] = React.useState<ParsedItem | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [currentChatId, setCurrentChatId] = React.useState<string | null>(null);
  const [openHistoryMenuId, setOpenHistoryMenuId] = React.useState<string | null>(null);
  const [settings, setSettings] = React.useState(defaultSettings);
  const [mounted, setMounted] = React.useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = React.useState(true);
  const [bundleFilter, setBundleFilter] = React.useState("");
  const [sortMode, setSortMode] = React.useState<SortMode>("latest");
  const [viewMode, setViewMode] = React.useState<ViewMode>("cards");
  const [selectedItemIds, setSelectedItemIds] = React.useState<string[]>([]);
  const [favoriteItemIds, setFavoriteItemIds] = React.useState<string[]>([]);
  const [includePromptInResult, setIncludePromptInResult] = React.useState(true);
  const [showSkippedFiles, setShowSkippedFiles] = React.useState(true);
  const [activity, setActivity] = React.useState<ActivityItem[]>([]);
  const [processing, setProcessing] = React.useState(false);
  const [rightSidebarWidth, setRightSidebarWidth] = React.useState(320);
  const [resizingSidebar, setResizingSidebar] = React.useState<null | "right">(null);
  const [language, setLanguage] = React.useState<Language>("ru");
  const [markdownEnabled, setMarkdownEnabled] = React.useState(true);
  const [activeMode, setActiveMode] = React.useState<ActiveMode>("chat");
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([]);
  const [autoSaveEnabled, setAutoSaveEnabled] = React.useState(true);
  const [editDialog, setEditDialog] = React.useState<EditDialogState | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as HistoryItem[];
      setHistory(parsed);
    } catch {
      setHistory([]);
    }
  }, []);

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
  }, []);

  React.useEffect(() => {
    if (anonymousMode) return;
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
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
  }, [resizingSidebar]);

  const finalText = React.useMemo(
    () =>
      combineToFinalTxt(
        items,
        includePromptInResult ? prompt : "",
        mounted ? new Date().toISOString() : undefined
      ),
    [items, prompt, mounted, includePromptInResult]
  );

  const estimateIfNotEmpty = React.useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return estimateTokens(trimmed);
  }, []);

  const contextTokens = React.useMemo(
    () => items.reduce((sum, item) => sum + item.tokenEstimate, 0),
    [items]
  );

  const draftPromptTokens = React.useMemo(
    () => estimateIfNotEmpty(prompt),
    [estimateIfNotEmpty, prompt]
  );

  const userChatTokens = React.useMemo(() => {
    const text = chatMessages
      .filter((message) => message.role === "user")
      .map((message) => message.content)
      .join("\n\n");

    return estimateIfNotEmpty(text);
  }, [chatMessages, estimateIfNotEmpty]);

  const totalTokens = contextTokens + userChatTokens + draftPromptTokens;

  const promptSuggestions = React.useMemo(
    () =>
      language === "ru"
        ? [
            "Сфокусируй ответ на архитектуре решения",
            "Сделай краткое summary в 5 пунктах",
            "Выдели риски и edge-cases",
            "Добавь actionable next steps",
          ]
        : [
            "Focus on solution architecture",
            "Create a concise 5-point summary",
            "Highlight risks and edge-cases",
            "Add actionable next steps",
          ],
    [language]
  );

  const pushActivity = React.useCallback((label: string) => {
    setActivity((prev) => [{ id: crypto.randomUUID(), label, at: new Date().toISOString() }, ...prev].slice(0, 12));
  }, []);

  const visibleItems = React.useMemo(() => {
    const filter = bundleFilter.trim().toLowerCase();
    const base = items.filter((item) => {
      if (!showSkippedFiles && item.error === "Skipped by filters") return false;
      if (!filter) return true;
      return `${item.name} ${item.path}`.toLowerCase().includes(filter);
    });

    const sorted = [...base];
    sorted.sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      if (sortMode === "tokens") return b.tokenEstimate - a.tokenEstimate;
      if (sortMode === "size") return b.size - a.size;
      return 0;
    });
    return sorted;
  }, [items, bundleFilter, sortMode, showSkippedFiles]);

  const selectedItems = React.useMemo(
    () => visibleItems.filter((item) => selectedItemIds.includes(item.id)),
    [visibleItems, selectedItemIds]
  );

  const skippedFiles = React.useMemo(
    () => items.filter((item) => item.error === "Skipped by filters").length,
    [items]
  );

  const totalBytes = React.useMemo(
    () => items.reduce((sum, item) => sum + item.size, 0),
    [items]
  );

  const totalFiles = React.useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.kind === "archive") return sum + (item.children?.length ?? 0);
      return sum + 1;
    }, 0);
  }, [items]);

  const contextGroups = React.useMemo<ContextGroup[]>(() => {
    const map = new Map<string, ContextGroup>();
    const order: string[] = [];
    const toTimestamp = (value: string) => {
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const addToGroup = (key: string, seed: Omit<ContextGroup, "items" | "tokenEstimate" | "size" | "fileCount" | "folderCount">, item: ParsedItem) => {
      if (!map.has(key)) {
        map.set(key, {
          ...seed,
          tokenEstimate: 0,
          size: 0,
          fileCount: 0,
          folderCount: 0,
          items: [],
        });
        order.push(key);
      }

      const current = map.get(key);
      if (!current) return;
      current.items.push(item);
      current.tokenEstimate += item.tokenEstimate;
      current.size += item.size;
      current.fileCount += item.kind === "archive" ? item.children?.length ?? 0 : 1;
      const itemAddedAt = item.addedAt ?? item.children?.[0]?.addedAt ?? new Date(0).toISOString();
      if (toTimestamp(itemAddedAt) >= toTimestamp(current.createdAt)) {
        current.createdAt = itemAddedAt;
      }
    };

    items.forEach((item) => {
      if (item.kind === "archive") {
        const folderSet = new Set<string>();
        item.children?.forEach((child) => {
          const normalized = child.path.replaceAll("\\", "/").split("/");
          for (let index = 1; index < normalized.length - 1; index += 1) {
            folderSet.add(normalized.slice(0, index + 1).join("/"));
          }
        });
        map.set(`archive:${item.id}`, {
          id: `archive:${item.id}`,
          label: item.name,
          path: item.path,
          kind: "archive",
          createdAt: item.addedAt ?? item.children?.[0]?.addedAt ?? new Date(0).toISOString(),
          fileCount: item.children?.length ?? 0,
          folderCount: folderSet.size,
          tokenEstimate: item.tokenEstimate,
          size: item.size,
          items: [item],
        });
        order.push(`archive:${item.id}`);
        return;
      }

      const normalizedPath = item.path.replaceAll("\\", "/");
      const segments = normalizedPath.split("/").filter(Boolean);
      if (segments.length > 1) {
        addToGroup(
          `folder:${segments[0]}`,
          {
            id: `folder:${segments[0]}`,
            label: segments[0],
            path: segments[0],
            kind: "folder",
            createdAt: item.addedAt ?? new Date(0).toISOString(),
          },
          item
        );
        return;
      }

      map.set(`file:${item.id}`, {
        id: `file:${item.id}`,
        label: item.name,
        path: item.path,
        kind: "file",
        createdAt: item.addedAt ?? new Date(0).toISOString(),
        fileCount: 1,
        folderCount: 0,
        tokenEstimate: item.tokenEstimate,
        size: item.size,
        items: [item],
      });
      order.push(`file:${item.id}`);
    });

    order.forEach((key) => {
      const entry = map.get(key);
      if (!entry || entry.kind !== "folder") return;
      const folderSet = new Set<string>();
      entry.items.forEach((item) => {
        const normalized = item.path.replaceAll("\\", "/").split("/");
        for (let index = 1; index < normalized.length - 1; index += 1) {
          folderSet.add(normalized.slice(0, index + 1).join("/"));
        }
      });
      entry.folderCount = folderSet.size;
    });

    return order.map((key) => map.get(key)).filter((value): value is ContextGroup => Boolean(value));
  }, [items]);

  const timelineEntries = React.useMemo<TimelineEntry[]>(() => {
    const toTimestamp = (value: string) => {
      const parsed = Date.parse(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const mapped = [
      ...chatMessages.map((message) => ({
        id: `message:${message.id}`,
        type: "message" as const,
        createdAt: message.createdAt,
        message,
      })),
      ...contextGroups.map((group) => ({
        id: `context:${group.id}`,
        type: "context" as const,
        createdAt: group.createdAt,
        group,
      })),
    ];

    return mapped
      .map((entry, index) => ({ ...entry, index, timestamp: toTimestamp(entry.createdAt) }))
      .sort((a, b) => (a.timestamp === b.timestamp ? a.index - b.index : a.timestamp - b.timestamp));
  }, [chatMessages, contextGroups]);

  const hasContent = prompt.trim().length > 0 || items.length > 0 || chatMessages.length > 0;

  const renderMessageBody = React.useCallback(
    (content: string) => {
      const hasMarkdownSyntax = /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s)|```|`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^\)]+\)|\|.+\||\$[^$]+\$/.test(
        content
      );

      if (!markdownEnabled) {
        return <pre className="whitespace-pre-wrap wrap-anywhere font-mono text-xs leading-5">{content}</pre>;
      }

      if (!hasMarkdownSyntax) {
        return <pre className="whitespace-pre-wrap wrap-anywhere text-sm leading-6 font-sans">{content}</pre>;
      }

      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      );
    },
    [markdownEnabled]
  );

  const t = i18n[language];
  const l = React.useCallback((ruText: string, enText: string) => (language === "ru" ? ruText : enText), [language]);

  const nextUntitledTitle = React.useMemo(() => {
    const untitledNumbers = history
      .map((entry) => /^Untitled\s+(\d+)$/i.exec(entry.title)?.[1])
      .filter(Boolean)
      .map((value) => Number(value));
    const maxUntitled = untitledNumbers.length ? Math.max(...untitledNumbers) : 0;
    return `Untitled ${maxUntitled + 1}`;
  }, [history]);

  const bytesToText = (value: number) => {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  };

  const upsertHistory = React.useCallback((entry: HistoryItem) => {
    setHistory((prev) => [entry, ...prev.filter((item) => item.id !== entry.id)].slice(0, 30));
  }, []);

  const saveToHistory = React.useCallback(
    (force = false) => {
      if (anonymousMode) return;

      const hasCurrentContent = prompt.trim().length > 0 || items.length > 0 || chatMessages.length > 0;
      if (!hasCurrentContent && !force) return;

      const id = currentChatId ?? crypto.randomUUID();
      const existingEntry = currentChatId ? history.find((entry) => entry.id === currentChatId) ?? null : null;
      const firstUserMessage = chatMessages.find((message) => message.role === "user")?.content.trim();
      const firstContextTitle = (() => {
        const firstItem = items[0];
        if (!firstItem) return "";
        if (firstItem.kind === "archive") {
          return firstItem.name.trim();
        }

        const normalizedPath = firstItem.path.replaceAll("\\", "/");
        const segments = normalizedPath.split("/").filter(Boolean);
        if (segments.length > 1) {
          return segments[0] ?? firstItem.name;
        }

        return firstItem.name || segments.at(-1) || normalizedPath;
      })();
      const entry: HistoryItem = {
        id,
        title: existingEntry?.title
          ?? (prompt.trim()
            ? prompt.trim().slice(0, 70)
            : firstUserMessage
              ? firstUserMessage.slice(0, 70)
              : firstContextTitle
                ? firstContextTitle.slice(0, 70)
                : nextUntitledTitle),
        updatedAt: new Date().toISOString(),
        tokenEstimate: totalTokens,
        finalText,
        prompt,
        items,
        chatMessages,
      };

      if (!currentChatId) setCurrentChatId(id);
      upsertHistory(entry);
    },
    [anonymousMode, chatMessages, currentChatId, finalText, history, items, nextUntitledTitle, prompt, totalTokens, upsertHistory]
  );

  React.useEffect(() => {
    if (!mounted || anonymousMode || !autoSaveEnabled) return;
    const hasCurrentContent = prompt.trim().length > 0 || items.length > 0 || chatMessages.length > 0;
    if (!hasCurrentContent) return;

    const timer = window.setTimeout(() => {
      saveToHistory();
    }, 450);

    return () => window.clearTimeout(timer);
  }, [mounted, anonymousMode, autoSaveEnabled, prompt, items, chatMessages, saveToHistory]);

  React.useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-history-item]")) {
        setOpenHistoryMenuId(null);
      }
    };

    window.addEventListener("click", handleOutside);
    return () => window.removeEventListener("click", handleOutside);
  }, []);

  React.useEffect(() => {
    const element = composerRef.current;
    if (!element) return;
    element.style.height = "0px";
    const next = Math.min(220, Math.max(56, element.scrollHeight));
    element.style.height = `${next}px`;
  }, [prompt]);

  return {
    fileInputRef,
    folderInputRef,
    composerRef,

    leftCollapsed,
    anonymousMode,
    prompt,
    items,
    activePreview,
    isParsing,
    history,
    currentChatId,
    openHistoryMenuId,
    settings,
    mounted,
    rightSidebarOpen,
    bundleFilter,
    sortMode,
    viewMode,
    selectedItemIds,
    favoriteItemIds,
    includePromptInResult,
    showSkippedFiles,
    activity,
    processing,
    rightSidebarWidth,
    resizingSidebar,
    language,
    markdownEnabled,
    activeMode,
    chatMessages,
    autoSaveEnabled,
    editDialog,

    setLeftCollapsed,
    setAnonymousMode,
    setPrompt,
    setItems,
    setActivePreview,
    setIsParsing,
    setHistory,
    setCurrentChatId,
    setOpenHistoryMenuId,
    setSettings,
    setRightSidebarOpen,
    setBundleFilter,
    setSortMode,
    setViewMode,
    setSelectedItemIds,
    setFavoriteItemIds,
    setIncludePromptInResult,
    setShowSkippedFiles,
    setProcessing,
    setRightSidebarWidth,
    setResizingSidebar,
    setLanguage,
    setMarkdownEnabled,
    setActiveMode,
    setChatMessages,
    setAutoSaveEnabled,
    setEditDialog,

    finalText,
    totalTokens,
    promptSuggestions,
    pushActivity,
    visibleItems,
    selectedItems,
    skippedFiles,
    totalBytes,
    totalFiles,
    contextGroups,
    timelineEntries,
    hasContent,
    renderMessageBody,
    t,
    l,
    bytesToText,
    saveToHistory,
  };
}

export type UseHomeStateResult = ReturnType<typeof useHomeState>;