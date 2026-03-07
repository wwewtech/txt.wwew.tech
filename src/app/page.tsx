"use client";

import * as React from "react";
import {
  ArrowDownToLine,
  Bot,
  CheckCheck,
  Copy,
  ChevronsUpDown,
  Files,
  ExternalLink,
  Eye,
  FileText,
  Github,
  Grid3X3,
  Link as LinkIcon,
  Link2,
  ListFilter,
  Loader2,
  MessageSquarePlus,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Pencil,
  Search,
  Shield,
  Save,
  Share2,
  Sparkles,
  WandSparkles,
  Star,
  Languages,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import {
  combineToFinalTxt,
  estimateTokens,
  parseFileWithPath,
  type ParseSettings,
  type ParsedItem,
} from "@/lib/file-parser";
import { ThemeToggle } from "@/components/theme-toggle";
import { DragSegmented } from "@/components/drag-segmented";
import { cn } from "@/lib/utils";

type HistoryItem = {
  id: string;
  title: string;
  updatedAt: string;
  tokenEstimate: number;
  finalText: string;
  prompt: string;
  items: ParsedItem[];
};

type ActivityItem = {
  id: string;
  label: string;
  at: string;
};

type SortMode = "latest" | "name" | "tokens" | "size";
type ViewMode = "cards" | "compact";
type Language = "ru" | "en";

const HISTORY_KEY = "txt-wwew-tech-history";
const UI_PREFS_KEY = "txt-wwew-tech-ui-prefs";

const defaultSettings: ParseSettings = {
  ignoredDirectories: ["node_modules", ".next", ".git", "dist", "build", ".cache"],
  excludedExtensions: ["pyc", "map", "lock", "exe", "dll", "md"],
};

export default function Home() {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const folderInputRef = React.useRef<HTMLInputElement | null>(null);

  const [leftCollapsed, setLeftCollapsed] = React.useState(false);
  const [anonymousMode, setAnonymousMode] = React.useState(false);
  const [prompt, setPrompt] = React.useState("");
  const [items, setItems] = React.useState<ParsedItem[]>([]);
  const [activePreview, setActivePreview] = React.useState<ParsedItem | null>(null);
  const [isParsing, setIsParsing] = React.useState(false);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [currentChatId, setCurrentChatId] = React.useState<string | null>(null);
  const [openHistoryMenuId, setOpenHistoryMenuId] = React.useState<string | null>(null);
  const [settings, setSettings] = React.useState<ParseSettings>(defaultSettings);
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
      const parsed = JSON.parse(raw) as { language?: Language; rightSidebarWidth?: number };
      if (parsed.language) setLanguage(parsed.language);
      if (typeof parsed.rightSidebarWidth === "number") {
        setRightSidebarWidth(Math.min(520, Math.max(280, parsed.rightSidebarWidth)));
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
      JSON.stringify({ language, rightSidebarWidth })
    );
  }, [language, rightSidebarWidth]);

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
  const totalTokens = React.useMemo(() => estimateTokens(finalText), [finalText]);

  const promptSuggestions = React.useMemo(
    () => [
      "Сфокусируй ответ на архитектуре решения",
      "Сделай краткое summary в 5 пунктах",
      "Выдели риски и edge-cases",
      "Добавь actionable next steps",
    ],
    []
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

  const hasContent = prompt.trim().length > 0 || items.length > 0;

  const i18n = {
    ru: {
      settings: "Settings",
      settingsSubtitle: "Tool cockpit",
      openRight: "Открыть правую панель",
      closeRight: "Скрыть правую панель",
      quickPrompts: "Быстрые подсказки",
      filter: "Фильтр...",
      parser: "Парсер",
      privacy: "Privacy",
      output: "Output",
      activity: "Activity",
      pipeline: "Pipeline",
      workspace: "Workspace",
      addFilesPrompt: "Добавьте файлы и prompt",
      nothingFound: "Ничего не найдено",
      noActions: "Действий пока нет",
      includePrompt: "Включать prompt",
      showSkipped: "Показывать skipped",
      anonymous: "Анонимный чат",
      ignoredDirs: "Игнорировать папки",
      excludedExt: "Исключить расширения",
      build: "Собрать",
      clear: "Очистить",
      draft: "Черновик",
      visible: "visible",
      selected: "selected",
      skipped: "skipped",
      buildSelected: "Собрать selected",
      remove: "Удалить",
      processing: "Обработка файлов...",
      parserReady: "Ready",
      parserProcessing: "Processing",
      builderReady: "Context ready",
      builderWaiting: "Waiting",
      historyEntries: "entries",
      sources: "Sources",
      files: "Files",
      size: "Size",
      tokens: "Tokens",
      theme: "Тема",
      terms: "Terms",
      newChat: "Новый чат",
      history: "История",
      noEntries: "Записей пока нет",
      actions: "Действия",
      makeCopy: "Сделать копию",
      share: "Поделиться",
      rename: "Переименовать",
      copyPrompt: "Копировать prompt",
      copyFinal: "Копировать итог",
      delete: "Удалить",
      builderTitle: "LLM Context Builder",
      promptPlaceholder: "Добавьте инструкцию для LLM...",
      uploadFiles: "Файлы",
      uploadFolder: "Папка",
      save: "Сохранить",
      downloadTxt: "Скачать .txt",
      parsing: "Парсинг файлов...",
      preview: "Превью",
      finalTxt: "Итоговый LLM-ready TXT",
      addFilesToSee: "Добавьте файлы, чтобы увидеть итоговый контекст.",
      close: "Закрыть",
      down: "Вниз",
      noData: "Нет данных",
    },
    en: {
      settings: "Settings",
      settingsSubtitle: "Tool cockpit",
      openRight: "Open right sidebar",
      closeRight: "Hide right sidebar",
      quickPrompts: "Quick Prompts",
      filter: "Filter...",
      parser: "Parser",
      privacy: "Privacy",
      output: "Output",
      activity: "Activity",
      pipeline: "Pipeline",
      workspace: "Workspace",
      addFilesPrompt: "Add files and prompt",
      nothingFound: "Nothing found",
      noActions: "No actions yet",
      includePrompt: "Include prompt",
      showSkipped: "Show skipped",
      anonymous: "Anonymous chat",
      ignoredDirs: "Ignore directories",
      excludedExt: "Excluded extensions",
      build: "Build",
      clear: "Clear",
      draft: "Draft",
      visible: "visible",
      selected: "selected",
      skipped: "skipped",
      buildSelected: "Build selected",
      remove: "Remove",
      processing: "Processing files...",
      parserReady: "Ready",
      parserProcessing: "Processing",
      builderReady: "Context ready",
      builderWaiting: "Waiting",
      historyEntries: "entries",
      sources: "Sources",
      files: "Files",
      size: "Size",
      tokens: "Tokens",
      theme: "Theme",
      terms: "Terms",
      newChat: "New chat",
      history: "History",
      noEntries: "No entries yet",
      actions: "Actions",
      makeCopy: "Duplicate",
      share: "Share",
      rename: "Rename",
      copyPrompt: "Copy prompt",
      copyFinal: "Copy final",
      delete: "Delete",
      builderTitle: "LLM Context Builder",
      promptPlaceholder: "Add instruction for LLM...",
      uploadFiles: "Files",
      uploadFolder: "Folder",
      save: "Save",
      downloadTxt: "Download .txt",
      parsing: "Parsing files...",
      preview: "Preview",
      finalTxt: "Final LLM-ready TXT",
      addFilesToSee: "Add files to see final context.",
      close: "Close",
      down: "Down",
      noData: "No data",
    },
  } as const;

  const t = i18n[language];

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

      const hasContent = prompt.trim().length > 0 || items.length > 0;
      if (!hasContent && !force) return;

      const id = currentChatId ?? crypto.randomUUID();
      const entry: HistoryItem = {
        id,
        title: prompt.trim() ? prompt.trim().slice(0, 70) : "Новый чат",
        updatedAt: new Date().toISOString(),
        tokenEstimate: totalTokens,
        finalText,
        prompt,
        items,
      };

      if (!currentChatId) setCurrentChatId(id);
      upsertHistory(entry);
    },
    [anonymousMode, currentChatId, finalText, items, prompt, totalTokens, upsertHistory]
  );

  React.useEffect(() => {
    if (!mounted || anonymousMode) return;
    const hasContent = prompt.trim().length > 0 || items.length > 0;
    if (!hasContent) return;

    const timer = window.setTimeout(() => {
      saveToHistory();
    }, 450);

    return () => window.clearTimeout(timer);
  }, [mounted, anonymousMode, prompt, items, saveToHistory]);

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

  const handleFiles = React.useCallback(
    async (incoming: { file: File; path: string }[]) => {
      if (!incoming.length) return;
      setIsParsing(true);
      setProcessing(true);
      try {
        pushActivity(`Загрузка: ${incoming.length} шт.`);
        const parsed = await Promise.all(
          incoming.map((entry) => parseFileWithPath(entry.file, entry.path, settings))
        );
        const clean = parsed.filter((item) => !item.error || item.error === "Skipped by filters");
        setItems((prev) => [...prev, ...clean]);
        pushActivity(`Добавлено в workspace: ${clean.length}`);
      } finally {
        setIsParsing(false);
        setProcessing(false);
      }
    },
    [settings, pushActivity]
  );

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped = Array.from(event.dataTransfer.files);
    const list = dropped.map((file) => ({
      file,
      path: file.webkitRelativePath || file.name,
    }));
    await handleFiles(list);
  };

  const onFilePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    const payload = selected.map((file) => ({
      file,
      path: file.webkitRelativePath || file.name,
    }));
    await handleFiles(payload);
    event.target.value = "";
  };

  const onCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        return success;
      } catch {
        return false;
      }
    }
  };

  const toBase64Unicode = (input: string) => {
    const bytes = new TextEncoder().encode(input);
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  };

  const renameHistoryItem = (id: string) => {
    const target = history.find((entry) => entry.id === id);
    if (!target) return;
    const nextTitle = window.prompt("Новое название чата", target.title);
    if (!nextTitle || !nextTitle.trim()) return;
    setHistory((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? { ...entry, title: nextTitle.trim().slice(0, 80), updatedAt: new Date().toISOString() }
          : entry
      )
    );
  };

  const duplicateHistoryItem = (id: string) => {
    const target = history.find((entry) => entry.id === id);
    if (!target) return;
    const duplicate: HistoryItem = {
      ...target,
      id: crypto.randomUUID(),
      title: `${target.title} (copy)`.slice(0, 80),
      updatedAt: new Date().toISOString(),
      items: [...target.items],
    };
    setHistory((prev) => [duplicate, ...prev]);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(null);
      setPrompt("");
      setItems([]);
    }
  };

  const shareHistoryItem = async (id: string) => {
    const target = history.find((entry) => entry.id === id);
    if (!target) return;
    const payload = {
      title: target.title,
      tokenEstimate: target.tokenEstimate,
      updatedAt: target.updatedAt,
      prompt: target.prompt,
    };
    const encoded = toBase64Unicode(JSON.stringify(payload));
    const url = `${window.location.origin}${window.location.pathname}#shared=${encoded}`;
    const copied = await onCopy(url);
    pushActivity(copied ? "Ссылка чата скопирована" : "Не удалось скопировать ссылку");
  };

  const exportTxt = () => {
    const blob = new Blob([finalText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `llm-context-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    pushActivity("Экспортирован итоговый TXT");
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const toggleFavoriteItem = (id: string) => {
    setFavoriteItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    setSelectedItemIds(visibleItems.map((item) => item.id));
    pushActivity(`Выбрано видимых: ${visibleItems.length}`);
  };

  const quickBuild = async () => {
    if (!items.length) return;
    const copied = await onCopy(finalText);
    pushActivity(copied ? "Быстрая сборка: контекст скопирован" : "Быстрая сборка: не удалось скопировать");
  };

  const startNewChat = () => {
    saveToHistory();
    setPrompt("");
    setItems([]);
    setCurrentChatId(null);
    setSelectedItemIds([]);
    setFavoriteItemIds([]);
    pushActivity("Новый чат");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        style={{ ["--right-sidebar-width" as string]: `${rightSidebarWidth}px` }}
        className={cn(
          "grid min-h-screen grid-cols-1",
          rightSidebarOpen
            ? leftCollapsed
              ? "xl:grid-cols-[minmax(700px,1fr)_4px_var(--right-sidebar-width)]"
              : "xl:grid-cols-[280px_minmax(700px,1fr)_4px_var(--right-sidebar-width)]"
            : leftCollapsed
              ? "xl:grid-cols-[minmax(700px,1fr)]"
              : "xl:grid-cols-[280px_minmax(700px,1fr)]"
        )}
      >
        {!leftCollapsed && (
          <aside className="hidden h-screen border-r border-border/70 bg-muted/15 px-3 py-3 xl:sticky xl:top-0 xl:flex xl:flex-col">
            <div className="mb-3 w-full rounded-2xl border border-border/70 bg-background/80 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold tracking-tight">txt.wwew.tech</p>
                  <p className="text-xs text-muted-foreground">Local Context Cockpit</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLeftCollapsed(true)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
            </div>

          <button
            type="button"
            onClick={startNewChat}
            className="mb-3 inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm hover:bg-muted"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>{t.newChat}</span>
          </button>

            <div className="min-h-0 w-full flex-1 overflow-auto rounded-2xl border border-border/70 bg-background/60 p-2">
              <p className="mb-2 px-2 text-xs uppercase tracking-wide text-muted-foreground">{t.history}</p>
              <div className="space-y-1">
                {history.length === 0 && (
                  <p className="px-2 py-1 text-xs text-muted-foreground">{t.noEntries}</p>
                )}
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    data-history-item
                    className={cn(
                      "group relative rounded-xl border border-transparent px-2 py-2 transition-colors hover:bg-muted",
                      currentChatId === entry.id && "border-border/70 bg-muted/60"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentChatId(entry.id);
                          setPrompt(entry.prompt);
                          setItems(entry.items ?? []);
                          setOpenHistoryMenuId(null);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-xs font-medium">{entry.title}</p>
                        <p className="text-[11px] text-muted-foreground">~{entry.tokenEstimate} tokens</p>
                      </button>

                      <div className="flex items-center gap-1">
                        <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenHistoryMenuId((prev) => (prev === entry.id ? null : entry.id));
                          }}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-background"
                          title={t.actions}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {openHistoryMenuId === entry.id && (
                      <div className="absolute right-1 top-9 z-20 w-44 rounded-xl border border-border/70 bg-background p-1 shadow-xl">
                        <button
                          type="button"
                          onClick={() => {
                            duplicateHistoryItem(entry.id);
                            setOpenHistoryMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                        >
                          <Files className="h-3.5 w-3.5" />
                          {t.makeCopy}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await shareHistoryItem(entry.id);
                            setOpenHistoryMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          {t.share}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            renameHistoryItem(entry.id);
                            setOpenHistoryMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          {t.rename}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await onCopy(entry.prompt || "");
                            setOpenHistoryMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          {t.copyPrompt}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await onCopy(entry.finalText || "");
                            setOpenHistoryMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {t.copyFinal}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteHistoryItem(entry.id);
                            setOpenHistoryMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-red-500 hover:bg-muted"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t.delete}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 w-full rounded-2xl border border-border/70 bg-background/80 p-3">
              <p className="mb-2 text-xs text-muted-foreground">{t.theme}</p>
              <ThemeToggle />

              <DragSegmented
                className="mt-2"
                value={language}
                onValueChange={(next) => setLanguage(next)}
                options={[
                  {
                    value: "ru",
                    label: "Русский",
                    content: (
                      <span className="inline-flex items-center gap-1 text-[10px]">
                        <Languages className="h-3.5 w-3.5" /> RU
                      </span>
                    ),
                  },
                  {
                    value: "en",
                    label: "English",
                    content: (
                      <span className="inline-flex items-center gap-1 text-[10px]">
                        <Languages className="h-3.5 w-3.5" /> EN
                      </span>
                    ),
                  },
                ]}
                buttonClassName="h-7 px-2"
              />

              <div className="mt-3 flex items-center gap-3 text-muted-foreground">
                <a href="https://wwew.tech" target="_blank" rel="noreferrer" className="hover:text-foreground">
                  <User className="h-4 w-4" />
                </a>
                <a href="https://openspacedev.ru" target="_blank" rel="noreferrer" className="hover:text-foreground">
                  <LinkIcon className="h-4 w-4" />
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground">
                  <Github className="h-4 w-4" />
                </a>
                <a href="#" className="text-[11px] hover:text-foreground">
                  {t.terms}
                </a>
              </div>
            </div>
          </aside>
        )}

        <main className="flex min-h-screen flex-col">
          {leftCollapsed && (
            <button
              type="button"
              onClick={() => setLeftCollapsed(false)}
              className="fixed left-4 top-4 z-40 hidden h-8 w-8 items-center justify-center rounded-lg border border-border bg-background shadow-sm transition-colors hover:bg-muted md:left-6 md:top-6 xl:inline-flex"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          )}
          {!rightSidebarOpen && (
            <button
              type="button"
              onClick={() => setRightSidebarOpen(true)}
              className="fixed right-4 top-4 z-40 hidden h-8 w-8 items-center justify-center rounded-lg border border-border bg-background shadow-sm transition-colors hover:bg-muted md:right-6 md:top-6 xl:inline-flex"
              title={t.openRight}
            >
              <PanelRightOpen className="h-4 w-4" />
            </button>
          )}
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-4 md:p-6">
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="mb-4 rounded-3xl border border-dashed border-border/80 bg-muted/10 p-6"
            >
              <div className="mb-3 flex items-center justify-between">
                <h1 className="text-lg font-semibold tracking-tight">{t.builderTitle}</h1>
                <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                  ~{totalTokens} tokens
                </span>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t.promptPlaceholder}
                className="min-h-28 w-full resize-none rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm outline-none ring-0"
              />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={onFilePick}
                  className="hidden"
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  onChange={onFilePick}
                  className="hidden"
                  {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs hover:bg-muted"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {t.uploadFiles}
                </button>
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs hover:bg-muted"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {t.uploadFolder}
                </button>
                <button
                  type="button"
                  onClick={() => saveToHistory(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs hover:bg-muted"
                >
                  <Save className="h-3.5 w-3.5" />
                  {t.save}
                </button>
                <button
                  type="button"
                  onClick={() => onCopy(finalText)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs hover:bg-muted"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {t.copyFinal}
                </button>
                <button
                  type="button"
                  onClick={exportTxt}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs hover:bg-muted"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  {t.downloadTxt}
                </button>
              </div>

              {isParsing && <p className="mt-3 text-xs text-muted-foreground">{t.parsing}</p>}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/70 bg-background/70 p-3">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.path}</p>
                    </div>
                    <span className="rounded-full border border-border/70 px-2 py-1 text-[11px] text-muted-foreground">
                      ~{item.tokenEstimate}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActivePreview(item)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-muted"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {t.preview}
                    </button>
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((entry) => entry.id !== item.id))}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-muted"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t.delete}
                    </button>
                    <button
                      type="button"
                      onClick={() => onCopy(item.text)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-muted"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {t.copyFinal}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-3xl border border-border/70 bg-background p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">{t.finalTxt}</p>
                <span className="text-xs text-muted-foreground">{finalText.length.toLocaleString()} chars</span>
              </div>
              <pre className="max-h-80 overflow-auto rounded-2xl bg-muted/30 p-3 text-xs whitespace-pre-wrap">
                {finalText || t.addFilesToSee}
              </pre>
            </div>
          </div>
        </main>

        {rightSidebarOpen && (
          <>
            <div
              role="separator"
              aria-orientation="vertical"
              className="hidden w-1 shrink-0 cursor-col-resize bg-border/40 transition-colors hover:bg-border xl:block"
              onMouseDown={(event) => {
                event.preventDefault();
                setResizingSidebar("right");
              }}
            />

            <aside
              className="hidden h-screen border-l border-border/70 bg-muted/10 xl:sticky xl:top-0 xl:block"
              style={{ width: `${rightSidebarWidth}px` }}
            >
              <div className="p-2 pb-0">
                <div className="mb-3 w-full rounded-2xl border border-border/70 bg-background/80 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold tracking-tight">{t.settings}</p>
                      <p className="text-xs text-muted-foreground">{t.settingsSubtitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRightSidebarOpen(false)}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted"
                      title={t.closeRight}
                    >
                      <PanelRightClose className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

            <div className="h-[calc(100vh-6.75rem)] space-y-2 overflow-auto p-2">
              <div className="rounded-xl border border-border/70 bg-background p-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold">{t.quickPrompts}</p>
                  <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {promptSuggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setPrompt((prev) => (prev ? `${prev}\n${item}` : item));
                        pushActivity("Добавлена prompt-подсказка");
                      }}
                      className="rounded-full border border-border/70 px-2 py-1 text-[10px] hover:bg-muted"
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={quickBuild}
                    disabled={processing || !items.length}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-border/70 px-2 text-[10px] hover:bg-muted disabled:opacity-40"
                  >
                    <WandSparkles className="h-3 w-3" /> {t.build}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPrompt("");
                      pushActivity("Поле prompt очищено");
                    }}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-border/70 px-2 text-[10px] hover:bg-muted"
                  >
                    {t.clear}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onCopy(finalText);
                      pushActivity("Черновой контекст скопирован");
                    }}
                    disabled={!items.length}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-border/70 px-2 text-[10px] hover:bg-muted disabled:opacity-40"
                  >
                    <Copy className="h-3 w-3" /> {t.draft}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background p-2">
                <div className="mb-2 grid grid-cols-[1fr_auto] gap-1.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      value={bundleFilter}
                      onChange={(e) => setBundleFilter(e.target.value)}
                      placeholder={t.filter}
                      className="h-8 w-full rounded-md border border-border/70 bg-background pl-7 pr-2 text-[11px]"
                    />
                  </div>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as SortMode)}
                    className="h-8 min-w-24 rounded-md border border-border/70 bg-background px-2 text-[11px]"
                  >
                    <option value="latest">Default</option>
                    <option value="name">Name</option>
                    <option value="tokens">Tokens</option>
                    <option value="size">Size</option>
                  </select>
                </div>

                <div className="mb-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewMode("cards")}
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/70",
                      viewMode === "cards" ? "bg-muted" : "bg-background"
                    )}
                  >
                    <Grid3X3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("compact")}
                    className={cn(
                      "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/70",
                      viewMode === "compact" ? "bg-muted" : "bg-background"
                    )}
                  >
                    <ChevronsUpDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={selectAllVisible}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-border/70 px-2 text-[10px] hover:bg-muted"
                  >
                    <CheckCheck className="h-3 w-3" /> {t.visible}
                  </button>
                </div>

                <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="rounded-md border border-border/70 px-1.5 py-0.5">{t.visible}: {visibleItems.length}</span>
                  <span className="rounded-md border border-border/70 px-1.5 py-0.5">{t.selected}: {selectedItems.length}</span>
                  <span className="rounded-md border border-border/70 px-1.5 py-0.5">{t.skipped}: {skippedFiles}</span>
                </div>

                <div className="mb-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      const text = combineToFinalTxt(
                        selectedItems,
                        includePromptInResult ? prompt : "",
                        mounted ? new Date().toISOString() : undefined
                      );
                      await onCopy(text);
                      pushActivity(`Собран selected: ${selectedItems.length}`);
                    }}
                    disabled={!selectedItems.length}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-border/70 px-2 text-[10px] hover:bg-muted disabled:opacity-40"
                  >
                    <ListFilter className="h-3 w-3" /> {t.buildSelected}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedItems.length) return;
                      setItems((prev) => prev.filter((item) => !selectedItemIds.includes(item.id)));
                      pushActivity(`Удалено selected: ${selectedItems.length}`);
                      setSelectedItemIds([]);
                    }}
                    disabled={!selectedItems.length}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-border/70 px-2 text-[10px] hover:bg-muted disabled:opacity-40"
                  >
                    <Trash2 className="h-3 w-3" /> {t.remove}
                  </button>
                </div>

                {!hasContent ? (
                  <div className="rounded-lg border border-dashed border-border/60 px-2 py-3 text-center text-[11px] text-muted-foreground">
                    {t.addFilesPrompt}
                  </div>
                ) : (
                  <div className={cn("max-h-60 overflow-auto", viewMode === "cards" ? "space-y-1.5" : "space-y-1")}>
                    {visibleItems.map((item) => {
                      const isSelected = selectedItemIds.includes(item.id);
                      const isFavorite = favoriteItemIds.includes(item.id);

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "rounded-lg border border-border/60 bg-background px-2 py-1.5",
                            isSelected && "border-primary/40 bg-primary/5"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectItem(item.id)}
                              className="h-3.5 w-3.5"
                            />
                            <p className="min-w-0 flex-1 truncate text-[11px] font-medium">{item.name}</p>
                            <span className="text-[10px] text-muted-foreground">{item.tokenEstimate}</span>
                            <button
                              type="button"
                              onClick={() => toggleFavoriteItem(item.id)}
                              className={cn("inline-flex h-5 w-5 items-center justify-center rounded", isFavorite && "bg-muted")}
                            >
                              <Star className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setActivePreview(item)}
                              className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await onCopy(item.text);
                                pushActivity(`Скопирован source: ${item.name}`);
                              }}
                              className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setItems((prev) => prev.filter((entry) => entry.id !== item.id));
                                pushActivity(`Удален source: ${item.name}`);
                              }}
                              className="inline-flex h-5 w-5 items-center justify-center rounded text-red-500 hover:bg-muted"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                          {viewMode === "cards" && (
                            <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{item.path}</p>
                          )}
                        </div>
                      );
                    })}
                    {visibleItems.length === 0 && items.length > 0 && (
                      <div className="rounded-lg border border-dashed border-border/60 px-2 py-3 text-center text-[11px] text-muted-foreground">
                        {t.nothingFound}
                      </div>
                    )}
                  </div>
                )}

                {processing && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-border/60 px-2 py-1.5 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t.processing}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border/70 bg-background p-2">
                <p className="mb-1 text-[11px] font-semibold">{t.workspace}</p>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="rounded-md border border-border/60 px-2 py-1.5">{t.sources}: {items.length}</div>
                  <div className="rounded-md border border-border/60 px-2 py-1.5">{t.files}: {totalFiles}</div>
                  <div className="rounded-md border border-border/60 px-2 py-1.5">{t.size}: {bytesToText(totalBytes)}</div>
                  <div className="rounded-md border border-border/60 px-2 py-1.5">{t.tokens}: ~{totalTokens}</div>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background p-2">
                <p className="mb-1 text-[11px] font-semibold">{t.pipeline}</p>
                <div className="space-y-1 text-[10px]">
                  <div className="rounded-md border border-border/60 px-2 py-1.5">{t.parser}: {processing ? t.parserProcessing : t.parserReady}</div>
                  <div className="rounded-md border border-border/60 px-2 py-1.5">Builder: {finalText ? t.builderReady : t.builderWaiting}</div>
                  <div className="rounded-md border border-border/60 px-2 py-1.5">History: {history.length} {t.historyEntries}</div>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background p-2">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold">{t.privacy}</p>
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <button
                  type="button"
                  onClick={() => setAnonymousMode((v) => !v)}
                  className={cn(
                    "w-full rounded-md border px-2 py-1.5 text-left text-[10px]",
                    anonymousMode ? "border-primary bg-primary/10" : "border-border/70"
                  )}
                >
                  {t.anonymous}: {anonymousMode ? "ON" : "OFF"}
                </button>
              </div>

              <div className="rounded-xl border border-border/70 bg-background p-2">
                <p className="mb-1 text-[11px] font-semibold">{t.parser}</p>
                <label className="mb-1 block text-[10px] text-muted-foreground">{t.ignoredDirs}</label>
                <textarea
                  value={settings.ignoredDirectories.join(",")}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      ignoredDirectories: e.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="mb-1.5 min-h-14 w-full rounded-md border border-border/70 bg-background p-1.5 text-[10px]"
                />
                <label className="mb-1 block text-[10px] text-muted-foreground">{t.excludedExt}</label>
                <textarea
                  value={settings.excludedExtensions.join(",")}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      excludedExtensions: e.target.value
                        .split(",")
                        .map((v) => v.trim().toLowerCase())
                        .filter(Boolean),
                    }))
                  }
                  className="min-h-14 w-full rounded-md border border-border/70 bg-background p-1.5 text-[10px]"
                />
              </div>

              <div className="rounded-xl border border-border/70 bg-background p-2">
                <p className="mb-1 text-[11px] font-semibold">{t.output}</p>
                <div className="space-y-1.5 text-[10px]">
                  <label className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1.5">
                    {t.includePrompt}
                    <input
                      type="checkbox"
                      checked={includePromptInResult}
                      onChange={(e) => setIncludePromptInResult(e.target.checked)}
                    />
                  </label>
                  <label className="flex items-center justify-between rounded-md border border-border/60 px-2 py-1.5">
                    {t.showSkipped}
                    <input
                      type="checkbox"
                      checked={showSkippedFiles}
                      onChange={(e) => setShowSkippedFiles(e.target.checked)}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background p-2 text-[10px]">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="font-semibold">{t.activity}</p>
                  <a href="https://github.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    Source <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="space-y-1">
                  {activity.length === 0 && (
                    <p className="rounded-md border border-dashed border-border/60 px-2 py-1.5 text-muted-foreground">
                      {t.noActions}
                    </p>
                  )}
                  {activity.map((item) => (
                    <div key={item.id} className="rounded-md border border-border/60 px-2 py-1.5">
                      <p>{item.label}</p>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">
                        {new Date(item.at).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
          </>
        )}
      </div>

      {activePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-2xl border border-border bg-background">
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{activePreview.name}</p>
                <p className="text-xs text-muted-foreground">~{activePreview.tokenEstimate} tokens</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onCopy(activePreview.text)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-muted"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {t.copyFinal}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItems((prev) => prev.filter((entry) => entry.id !== activePreview.id));
                    setActivePreview(null);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-muted"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t.delete}
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreview(null)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                  {t.close}
                </button>
              </div>
            </div>
            <div className="preview-scroll min-h-0 flex-1 overflow-auto p-4">
              <pre className="text-xs whitespace-pre-wrap">{activePreview.text || t.noData}</pre>
            </div>
            <div className="border-t border-border/70 p-3">
              <button
                type="button"
                onClick={() => {
                  const container = document.querySelector(".preview-scroll");
                  if (container) container.scrollTop = container.scrollHeight;
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-muted"
              >
                <FileText className="h-3.5 w-3.5" />
                {t.down}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
