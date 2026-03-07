"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  ArrowDownToLine,
  Archive,
  ChevronDown,
  CheckCheck,
  Code2,
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
  SendHorizontal,
  Search,
  Shield,
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
  chatMessages: ChatMessage[];
};

type ActivityItem = {
  id: string;
  label: string;
  at: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type ContextGroup = {
  id: string;
  label: string;
  path: string;
  kind: "file" | "folder" | "archive";
  createdAt: string;
  fileCount: number;
  folderCount: number;
  tokenEstimate: number;
  size: number;
  items: ParsedItem[];
};

type EditDialogState =
  | {
      mode: "context-group";
      value: string;
      group: ContextGroup;
    }
  | {
      mode: "context-item";
      value: string;
      item: ParsedItem;
    }
  | {
      mode: "history-rename";
      value: string;
      historyId: string;
    };

type SortMode = "latest" | "name" | "tokens" | "size";
type ViewMode = "cards" | "compact";
type Language = "ru" | "en";

const HISTORY_KEY = "txt-wwew-tech-history";
const UI_PREFS_KEY = "txt-wwew-tech-ui-prefs";

const defaultSettings: ParseSettings = {
  ignoredDirectories: ["node_modules", ".next", ".git", "dist", "build", ".cache", "venv", "__pycache__", "obj", "bin", ],
  excludedExtensions: ["pyc", "map", "lock", "exe", "dll", "bin", "dat", "iso", "img"],
};

export function CollapsibleMarkdownPre({ children }: { children: React.ReactNode }) {
  const first = React.Children.toArray(children)[0] as
    | React.ReactElement<{ className?: string; children?: React.ReactNode }>
    | undefined;
  const className = first?.props?.className ?? "";
  const lang = /language-([a-zA-Z0-9_-]+)/.exec(className)?.[1] ?? "code";

  const textContent = React.useMemo(() => {
    const raw = first?.props?.children;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw)) {
      return raw
        .map((part) => (typeof part === "string" ? part : ""))
        .join("");
    }
    return "";
  }, [first]);

  const lineCount = React.useMemo(() => {
    if (!textContent) return 0;
    return textContent.split(/\r?\n/).length;
  }, [textContent]);

  const [collapsed, setCollapsed] = React.useState(lineCount > 8);
  const previousTextContentRef = React.useRef(textContent);

  React.useEffect(() => {
    if (previousTextContentRef.current === textContent) return;
    previousTextContentRef.current = textContent;
    setCollapsed(lineCount > 8);
  }, [lineCount, textContent]);

  const isRu = typeof document !== "undefined" && document.documentElement.lang.toLowerCase().startsWith("ru");
  const preT = isRu
    ? {
        toggle: "Переключить блок кода",
        expand: "Развернуть",
        collapse: "Свернуть",
        hidden: "Код скрыт",
        lines: "строк",
      }
    : {
        toggle: "Toggle code block",
        expand: "Expand",
        collapse: "Collapse",
        hidden: "Code hidden",
        lines: "lines",
      };

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/40">
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>{lang}</span>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="inline-flex items-center gap-1 rounded px-1 py-0.5 normal-case hover:bg-background/70"
          aria-label={preT.toggle}
        >
          <span>{collapsed ? preT.expand : preT.collapse}</span>
          <ChevronDown className={cn("h-3 w-3 transition-transform", collapsed && "-rotate-90")} />
        </button>
      </div>
      {collapsed ? (
        <div className="px-3 py-2 text-[11px] text-muted-foreground">{preT.hidden} • {lineCount} {preT.lines}</div>
      ) : (
        <pre className="overflow-x-auto p-3 text-xs leading-5">{children}</pre>
      )}
    </div>
  );
}

const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => <p className="text-lg font-semibold">{children}</p>,
  h2: ({ children }: { children?: React.ReactNode }) => <p className="text-base font-semibold">{children}</p>,
  h3: ({ children }: { children?: React.ReactNode }) => <p className="text-sm font-semibold">{children}</p>,
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="whitespace-pre-wrap text-sm leading-6 wrap-anywhere">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc space-y-1 pl-5 text-sm">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal space-y-1 pl-5 text-sm">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border-b border-border/60 bg-muted/40 px-2 py-1.5 text-left font-medium">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => <td className="border-b border-border/40 px-2 py-1.5 align-top">{children}</td>,
  pre: ({ children }: { children?: React.ReactNode }) => {
    return <CollapsibleMarkdownPre>{children}</CollapsibleMarkdownPre>;
  },
  code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode; inline?: boolean }) => {
    const isInline = props.inline;
    const isBlock = Boolean(className?.includes("language-")) || isInline === false;
    if (isBlock) return <code className={className}>{children}</code>;
    return <code className="rounded border border-border/60 bg-muted/40 px-1 py-0.5 text-xs">{children}</code>;
  },
};

export default function Home() {
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
  const [markdownEnabled, setMarkdownEnabled] = React.useState(true);
  const [activeMode, setActiveMode] = React.useState<"chat" | "stream" | "realtime">("chat");
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

  const timelineEntries = React.useMemo(() => {
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

  const i18n = {
    ru: {
      settings: "Настройки",
      settingsSubtitle: "Панель инструментов",
      openRight: "Открыть правую панель",
      closeRight: "Скрыть правую панель",
      quickPrompts: "Быстрые подсказки",
      filter: "Фильтр...",
      parser: "Парсер",
      privacy: "Приватность",
      output: "Результат",
      activity: "Активность",
      pipeline: "Пайплайн",
      workspace: "Рабочая область",
      addFilesPrompt: "Добавьте файлы и промпт",
      nothingFound: "Ничего не найдено",
      noActions: "Действий пока нет",
      includePrompt: "Включать промпт",
      showSkipped: "Показывать пропущенные",
      anonymous: "Анонимный чат",
      ignoredDirs: "Игнорировать папки",
      excludedExt: "Исключить расширения",
      build: "Собрать",
      draft: "Черновик",
      autosave: "Автосейв",
      chatLabel: "Чат",
      modeChat: "Чат",
      modeStream: "Поток",
      modeRealtime: "Реалтайм",
      markdownOn: "Markdown ВКЛ",
      raw: "Сырой",
      visible: "видимые",
      selected: "выбрано",
      skipped: "пропущено",
      buildSelected: "Собрать выбранное",
      remove: "Удалить",
      processing: "Обработка файлов...",
      parserReady: "Готов",
      parserProcessing: "Обработка",
      builderReady: "Контекст готов",
      builderWaiting: "Ожидание",
      historyEntries: "записей",
      sources: "Источники",
      files: "Файлы",
      size: "Размер",
      tokens: "Токены",
      tokenSuffix: "токенов",
      theme: "Тема",
      terms: "Условия",
      newChat: "Новый чат",
      history: "История",
      noEntries: "Записей пока нет",
      actions: "Действия",
      source: "Источник",
      makeCopy: "Сделать копию",
      share: "Поделиться",
      rename: "Переименовать",
      copyPrompt: "Копировать промпт",
      copyFinal: "Копировать итог",
      delete: "Удалить",
      builderTitle: "Сборщик LLM-контекста",
      promptPlaceholder: "Добавьте инструкцию для LLM...",
      uploadFiles: "Файлы",
      uploadFolder: "Папка",
      save: "Сохранить",
      downloadTxt: "Скачать .txt",
      parsing: "Парсинг файлов...",
      preview: "Превью",
      finalTxt: "Итоговый LLM-ready TXT",
      addFilesToSee: "Добавьте файлы, чтобы увидеть итоговый контекст.",
      dropHint: "Перетащи файлы, архивы или папки сюда, чтобы построить единый LLM-ready контекст.",
      localCockpit: "Локальный контекст-кокпит",
      typingPlaceholder: "Введите сообщение…",
      send: "Отправить",
      you: "Вы",
      contextEngine: "Контекст-движок",
      fileCount: "файлов",
      folderCount: "папок",
      archiveParsed: "Архив распарсен",
      folderStructure: "Структура папки",
      singleFile: "Одиночный файл",
      previewAction: "Предпросмотр",
      download: "Скачать",
      edit: "Изменить",
      searchHint: "Поиск по имени или пути файла",
      sortDefault: "По умолчанию",
      sortName: "Имя",
      sortTokens: "Токены",
      sortSize: "Размер",
      close: "Закрыть",
      closeChat: "Закрыть чат",
      draftChat: "Новый чат (черновик)",
      down: "Вниз",
      noData: "Нет данных",
      editContextTitle: "Изменить контекст",
      renameChatTitle: "Новое название чата",
      editPlaceholder: "Введите новый контекст...",
      renamePlaceholder: "Введите название чата...",
      cancel: "Отмена",
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
      draft: "Draft",
      autosave: "Autosave",
      chatLabel: "Chat",
      modeChat: "Chat",
      modeStream: "Stream",
      modeRealtime: "Realtime",
      markdownOn: "Markdown ON",
      raw: "Raw",
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
      tokenSuffix: "tokens",
      theme: "Theme",
      terms: "Terms",
      newChat: "New chat",
      history: "History",
      noEntries: "No entries yet",
      actions: "Actions",
      source: "Source",
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
      dropHint: "Drop files, archives, or folders here to build a unified LLM-ready context.",
      localCockpit: "Local Context Cockpit",
      typingPlaceholder: "Type something…",
      send: "Send",
      you: "You",
      contextEngine: "Context Engine",
      fileCount: "files",
      folderCount: "folders",
      archiveParsed: "Archive parsed",
      folderStructure: "Folder structure",
      singleFile: "Single file",
      previewAction: "Preview",
      download: "Download",
      edit: "Edit",
      searchHint: "Search by file name or path",
      sortDefault: "Default",
      sortName: "Name",
      sortTokens: "Tokens",
      sortSize: "Size",
      close: "Close",
      closeChat: "Close chat",
      draftChat: "New chat (draft)",
      down: "Down",
      noData: "No data",
      editContextTitle: "Edit context",
      renameChatTitle: "New chat title",
      editPlaceholder: "Enter updated context...",
      renamePlaceholder: "Enter chat title...",
      cancel: "Cancel",
    },
  } as const;

  const t = i18n[language];
  const l = React.useCallback((ruText: string, enText: string) => (language === "ru" ? ruText : enText), [language]);

  const currentHistoryEntry = React.useMemo(
    () => (currentChatId ? history.find((entry) => entry.id === currentChatId) ?? null : null),
    [currentChatId, history]
  );

  const nextUntitledTitle = React.useMemo(() => {
    const untitledNumbers = history
      .map((entry) => /^Untitled\s+(\d+)$/i.exec(entry.title)?.[1])
      .filter(Boolean)
      .map((value) => Number(value));
    const maxUntitled = untitledNumbers.length ? Math.max(...untitledNumbers) : 0;
    return `Untitled ${maxUntitled + 1}`;
  }, [history]);

  const activeChatTitle = currentHistoryEntry?.title ?? nextUntitledTitle;

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

      const hasContent = prompt.trim().length > 0 || items.length > 0 || chatMessages.length > 0;
      if (!hasContent && !force) return;

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
    const hasContent = prompt.trim().length > 0 || items.length > 0 || chatMessages.length > 0;
    if (!hasContent) return;

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

  const handleFiles = React.useCallback(
    async (incoming: { file: File; path: string }[]) => {
      if (!incoming.length) return;
      setIsParsing(true);
      setProcessing(true);
      try {
        pushActivity(l(`Загрузка: ${incoming.length} шт.`, `Upload: ${incoming.length} item(s)`));
        const parsed = await Promise.all(
          incoming.map((entry) => parseFileWithPath(entry.file, entry.path, settings))
        );
        const addedAt = new Date().toISOString();
        const clean = parsed
          .filter((item) => !item.error || item.error === "Skipped by filters")
          .map((item) => ({ ...item, addedAt }));
        setItems((prev) => [...prev, ...clean]);
        pushActivity(l(`Добавлено в workspace: ${clean.length}`, `Added to workspace: ${clean.length}`));
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

  const toTxtContext = React.useCallback((content: string) => {
    return content
      .replace(/^### FILE: .*$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }, []);

  const triggerDownload = React.useCallback((fileName: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const removeContextItems = React.useCallback((ids: string[], label: string) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setItems((prev) => prev.filter((entry) => !idSet.has(entry.id)));
    setSelectedItemIds((prev) => prev.filter((id) => !idSet.has(id)));
    setFavoriteItemIds((prev) => prev.filter((id) => !idSet.has(id)));
    setActivePreview((prev) => (prev && idSet.has(prev.id) ? null : prev));
    pushActivity(l(`Удален контекст: ${label}`, `Context removed: ${label}`));
  }, [pushActivity, l]);

  const editContextItems = React.useCallback((group: ContextGroup) => {
    const current = group.items.map((entry) => entry.text).filter(Boolean).join("\n\n");
    setEditDialog({ mode: "context-group", value: current, group });
  }, []);

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
    setEditDialog({ mode: "history-rename", value: target.title, historyId: id });
  };

  const submitEditDialog = React.useCallback(() => {
    if (!editDialog) return;
    const edited = editDialog.value.trim();
    if (!edited) return;

    if (editDialog.mode === "context-group") {
      const group = editDialog.group;
      const ids = group.items.map((entry) => entry.id);
      const idSet = new Set(ids);
      const primaryId = ids[0] ?? crypto.randomUUID();
      const replacement: ParsedItem = {
        id: primaryId,
        name: group.label,
        path: group.path,
        size: edited.length,
        kind: "file",
        text: edited,
        tokenEstimate: estimateTokens(edited),
        sourceType: "md",
        addedAt: new Date().toISOString(),
      };

      setItems((prev) => {
        const nextItems: ParsedItem[] = [];
        let inserted = false;

        prev.forEach((entry) => {
          if (!idSet.has(entry.id)) {
            nextItems.push(entry);
            return;
          }

          if (!inserted) {
            nextItems.push(replacement);
            inserted = true;
          }
        });

        if (!inserted) nextItems.push(replacement);
        return nextItems;
      });

      setSelectedItemIds((prev) => {
        const kept = prev.filter((id) => !idSet.has(id));
        return kept.includes(primaryId) ? kept : [...kept, primaryId];
      });
      setFavoriteItemIds((prev) => {
        const kept = prev.filter((id) => !idSet.has(id));
        return kept.includes(primaryId) ? kept : [...kept, primaryId];
      });
      setActivePreview((prev) => (prev && idSet.has(prev.id) ? replacement : prev));
      pushActivity(l(`Контекст изменен: ${group.label}`, `Context updated: ${group.label}`));
      setEditDialog(null);
      return;
    }

    if (editDialog.mode === "context-item") {
      const item = editDialog.item;
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                text: edited,
                size: edited.length,
                tokenEstimate: estimateTokens(edited),
              }
            : entry
        )
      );
      setActivePreview((prev) =>
        prev?.id === item.id
          ? {
              ...prev,
              text: edited,
              size: edited.length,
              tokenEstimate: estimateTokens(edited),
            }
          : prev
      );
          pushActivity(l(`Контекст изменен: ${item.name}`, `Context updated: ${item.name}`));
      setEditDialog(null);
      return;
    }

    setHistory((prev) =>
      prev.map((entry) =>
        entry.id === editDialog.historyId
          ? { ...entry, title: edited.slice(0, 80), updatedAt: new Date().toISOString() }
          : entry
      )
    );
    setEditDialog(null);
  }, [editDialog, pushActivity, l]);

  const duplicateHistoryItem = (id: string) => {
    const target = history.find((entry) => entry.id === id);
    if (!target) return;
    const duplicate: HistoryItem = {
      ...target,
      id: crypto.randomUUID(),
      title: `${target.title} (copy)`.slice(0, 80),
      updatedAt: new Date().toISOString(),
      items: [...target.items],
      chatMessages: [...(target.chatMessages ?? [])],
    };
    setHistory((prev) => [duplicate, ...prev]);
  };

  const deleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(null);
      setPrompt("");
      setItems([]);
      setChatMessages([]);
      setSelectedItemIds([]);
      setFavoriteItemIds([]);
      setActivePreview(null);
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
    pushActivity(copied ? l("Ссылка чата скопирована", "Chat link copied") : l("Не удалось скопировать ссылку", "Failed to copy chat link"));
  };

  const exportTxt = () => {
    const blob = new Blob([finalText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `llm-context-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    pushActivity(l("Экспортирован итоговый TXT", "Final TXT exported"));
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
    pushActivity(l(`Выбрано видимых: ${visibleItems.length}`, `Selected visible: ${visibleItems.length}`));
  };

  const quickBuild = async () => {
    if (!items.length) return;
    const copied = await onCopy(finalText);
    pushActivity(copied ? l("Быстрая сборка: контекст скопирован", "Quick build: context copied") : l("Быстрая сборка: не удалось скопировать", "Quick build: copy failed"));
  };

  const sendPrompt = () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    const now = new Date().toISOString();
    setChatMessages((prev) => {
      return [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: trimmed, createdAt: now },
      ];
    });
    pushActivity(l("Prompt отправлен в контекстную ленту", "Prompt sent to context timeline"));
    if (autoSaveEnabled) {
      saveToHistory(true);
    }
    setPrompt("");
  };

  const resetCurrentSession = () => {
    setPrompt("");
    setItems([]);
    setChatMessages([]);
    setCurrentChatId(null);
    setSelectedItemIds([]);
    setFavoriteItemIds([]);
    setActivePreview(null);
  };

  const startNewChat = () => {
    if (autoSaveEnabled) {
      saveToHistory();
    }
    resetCurrentSession();
    pushActivity(l("Новый чат", "New chat"));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        style={{ ["--right-sidebar-width" as string]: `${rightSidebarWidth}px` }}
        className={cn(
          "grid min-h-screen grid-cols-1",
          rightSidebarOpen
            ? leftCollapsed
              ? "xl:grid-cols-[minmax(0,1fr)_4px_var(--right-sidebar-width)]"
              : "xl:grid-cols-[280px_minmax(0,1fr)_4px_var(--right-sidebar-width)]"
            : leftCollapsed
              ? "xl:grid-cols-[minmax(0,1fr)]"
              : "xl:grid-cols-[280px_minmax(0,1fr)]"
        )}
      >
        {!leftCollapsed && (
          <aside className="hidden h-screen border-r border-border/70 bg-muted/15 px-3 py-3 xl:sticky xl:top-0 xl:flex xl:flex-col">
            <div className="mb-3 w-full rounded-2xl border border-border/70 bg-background/80 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold tracking-tight">txt.wwew.tech</p>
                  <p className="text-xs text-muted-foreground">{t.localCockpit}</p>
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

            <div className="mb-3 rounded-2xl border border-border/70 bg-background/80 p-2">
              <button
                type="button"
                onClick={() => setAutoSaveEnabled((value) => !value)}
                className={cn(
                  "w-full rounded-lg border px-2 py-1.5 text-left text-[11px]",
                  autoSaveEnabled ? "border-primary bg-primary/10" : "border-border/70"
                )}
              >
                {t.autosave}: {autoSaveEnabled ? "ON" : "OFF"}
              </button>
            </div>

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
                          setChatMessages(entry.chatMessages ?? []);
                          setSelectedItemIds([]);
                          setFavoriteItemIds([]);
                          setActivePreview(null);
                          setOpenHistoryMenuId(null);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="truncate text-xs font-medium">{entry.title}</p>
                        <p className="text-[11px] text-muted-foreground">~{entry.tokenEstimate} {t.tokenSuffix}</p>
                      </button>

                      <div className="flex items-center gap-1">
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

        <main className="flex h-screen min-h-screen flex-col overflow-hidden">
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
          <div className="mx-auto flex h-full w-full max-w-4xl flex-1 flex-col p-4 md:p-6">
            <div className="mb-3 rounded-2xl border border-border/70 bg-background/90 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold tracking-tight">{t.builderTitle}</span>
                    <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] text-muted-foreground">
                      ~{totalTokens} {t.tokenSuffix}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {t.chatLabel}: {activeChatTitle}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMarkdownEnabled((value) => !value)}
                    className={cn(
                      "inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-xs",
                      markdownEnabled ? "border-primary/40 bg-primary/10" : "border-border/70 bg-background"
                    )}
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    {markdownEnabled ? t.markdownOn : t.raw}
                  </button>
                  <DragSegmented
                    value={activeMode}
                    onValueChange={(value) => setActiveMode(value)}
                    options={[
                      { value: "chat", label: t.modeChat, content: <span className="text-[11px]">{t.modeChat}</span> },
                      { value: "stream", label: t.modeStream, content: <span className="text-[11px]">{t.modeStream}</span> },
                      { value: "realtime", label: t.modeRealtime, content: <span className="text-[11px]">{t.modeRealtime}</span> },
                    ]}
                    buttonClassName="h-7 px-2"
                  />
                </div>
              </div>
            </div>

            <div
              onDrop={onDrop}
              onDragOver={(event) => event.preventDefault()}
              className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-border/70 bg-muted/10"
            >
              <div className="flex h-full flex-col">
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
                    {timelineEntries.length === 0 && (
                      <div className="rounded-2xl border border-dashed border-border/70 bg-background/70 px-4 py-6 text-center text-sm text-muted-foreground">
                        {t.dropHint}
                      </div>
                    )}

                    {timelineEntries.map((entry) => {
                      if (entry.type === "message") {
                        const message = entry.message;
                        return (
                          <div
                            key={entry.id}
                            className={cn(
                              "w-full rounded-2xl border px-4 py-3",
                              message.role === "user"
                                ? "ml-auto border-border/70 bg-background"
                                : "mr-auto border-primary/20 bg-primary/5"
                            )}
                          >
                            <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>{message.role === "user" ? t.you : t.contextEngine}</span>
                              <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <div className="space-y-2 wrap-anywhere">{renderMessageBody(message.content)}</div>
                          </div>
                        );
                      }

                      const group = entry.group;
                      const joinedText = group.items.map((item) => item.text).filter(Boolean).join("\n\n");

                      return (
                        <div key={entry.id} className="group rounded-2xl border border-border/70 bg-background/90 p-3">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{group.label}</p>
                              <p className="truncate text-xs text-muted-foreground">{group.path}</p>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              {group.kind === "archive" ? <Archive className="h-3.5 w-3.5" /> : <Files className="h-3.5 w-3.5" />}
                              <span>~{group.tokenEstimate} {t.tokenSuffix}</span>
                            </div>
                          </div>

                          <div className="mb-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                            <span className="rounded-md border border-border/60 px-2 py-1">{t.fileCount}: {group.fileCount}</span>
                            <span className="rounded-md border border-border/60 px-2 py-1">{t.folderCount}: {group.folderCount}</span>
                            <span className="rounded-md border border-border/60 px-2 py-1">{bytesToText(group.size)}</span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs text-muted-foreground">
                              {group.kind === "archive"
                                ? `${t.archiveParsed}: ${group.fileCount} ${t.fileCount}`
                                : group.kind === "folder"
                                  ? `${t.folderStructure}: ${group.label}`
                                  : t.singleFile}
                            </p>
                            <div className="flex items-center gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => {
                                  if (group.items.length === 1 && group.kind === "file") {
                                    setActivePreview(group.items[0]);
                                    return;
                                  }

                                  setActivePreview({
                                    id: group.id,
                                    name: group.label,
                                    path: group.path,
                                    kind: "archive",
                                    size: group.size,
                                    sourceType: group.kind,
                                    tokenEstimate: group.tokenEstimate,
                                    text: joinedText,
                                    children: group.items,
                                  });
                                }}
                                className="inline-flex h-7 items-center gap-1 rounded-lg border border-border/70 px-2 text-[11px] hover:bg-muted"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                  {t.previewAction}
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const txt = toTxtContext(joinedText);
                                  await onCopy(txt);
                                  pushActivity(l(`Скопирован TXT: ${group.label}`, `Copied TXT: ${group.label}`));
                                }}
                                className="inline-flex h-7 items-center gap-1 rounded-lg border border-border/70 px-2 text-[11px] hover:bg-muted"
                              >
                                TXT
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await onCopy(joinedText);
                                  pushActivity(l(`Скопирован MD: ${group.label}`, `Copied MD: ${group.label}`));
                                }}
                                className="inline-flex h-7 items-center gap-1 rounded-lg border border-border/70 px-2 text-[11px] hover:bg-muted"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                MD
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  triggerDownload(`${group.label}.md`, joinedText, "text/markdown;charset=utf-8");
                                  pushActivity(l(`Скачан MD: ${group.label}`, `Downloaded MD: ${group.label}`));
                                }}
                                className="inline-flex h-7 items-center gap-1 rounded-lg border border-border/70 px-2 text-[11px] hover:bg-muted"
                              >
                                <ArrowDownToLine className="h-3.5 w-3.5" />
                                  {t.download}
                              </button>
                              <button
                                type="button"
                                onClick={() => editContextItems(group)}
                                className="inline-flex h-7 items-center gap-1 rounded-lg border border-border/70 px-2 text-[11px] hover:bg-muted"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                  {t.edit}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  removeContextItems(group.items.map((entry) => entry.id), group.label);
                                }}
                                className="inline-flex h-7 items-center gap-1 rounded-lg border border-border/70 px-2 text-[11px] hover:bg-muted"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                  {t.delete}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-border/60 bg-background/90 p-3 md:p-4">
                  <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-border/70 bg-background px-3 py-2 shadow-sm">
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
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 hover:bg-muted"
                      title={t.uploadFiles}
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => folderInputRef.current?.click()}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 hover:bg-muted"
                      title={t.uploadFolder}
                    >
                      <Upload className="h-4 w-4" />
                    </button>

                    <textarea
                      ref={composerRef}
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      placeholder={t.typingPlaceholder}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendPrompt();
                        }
                      }}
                      className="max-h-56 min-h-14 w-full resize-none overflow-y-auto rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none"
                    />

                    <div className="flex shrink-0 items-center gap-2 pb-1">
                      <button
                        type="button"
                        onClick={exportTxt}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 hover:bg-muted"
                        title={t.downloadTxt}
                      >
                        <ArrowDownToLine className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={sendPrompt}
                        disabled={!prompt.trim()}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary disabled:opacity-40"
                        title={t.send}
                      >
                        <SendHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {isParsing && <p className="mx-auto mt-2 w-full max-w-3xl text-xs text-muted-foreground">{t.parsing}</p>}
                </div>
              </div>
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
                        pushActivity(l("Добавлена prompt-подсказка", "Prompt suggestion added"));
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
                    onClick={async () => {
                      await onCopy(finalText);
                      pushActivity(l("Черновой контекст скопирован", "Draft context copied"));
                    }}
                    disabled={!items.length}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-border/70 px-2 text-[10px] hover:bg-muted disabled:opacity-40"
                  >
                    <Copy className="h-3 w-3" /> {t.draft}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-border/70 bg-background p-2">
                {items.length > 0 && (
                  <>
                    <p className="mb-1 text-[10px] text-muted-foreground">{t.searchHint}</p>
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
                        <option value="latest">{t.sortDefault}</option>
                        <option value="name">{t.sortName}</option>
                        <option value="tokens">{t.sortTokens}</option>
                        <option value="size">{t.sortSize}</option>
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
                          pushActivity(l(`Собран selected: ${selectedItems.length}`, `Built selected: ${selectedItems.length}`));
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
                          pushActivity(l(`Удалено selected: ${selectedItems.length}`, `Removed selected: ${selectedItems.length}`));
                          setSelectedItemIds([]);
                        }}
                        disabled={!selectedItems.length}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-border/70 px-2 text-[10px] hover:bg-muted disabled:opacity-40"
                      >
                        <Trash2 className="h-3 w-3" /> {t.remove}
                      </button>
                    </div>
                  </>
                )}

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
                                await onCopy(toTxtContext(item.text));
                                pushActivity(l(`Скопирован TXT: ${item.name}`, `Copied TXT: ${item.name}`));
                              }}
                              className="inline-flex h-5 items-center justify-center rounded px-1.5 text-[10px] hover:bg-muted"
                            >
                              TXT
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await onCopy(item.text);
                                pushActivity(l(`Скопирован MD: ${item.name}`, `Copied MD: ${item.name}`));
                              }}
                              className="inline-flex h-5 items-center justify-center rounded px-1.5 text-[10px] hover:bg-muted"
                            >
                              MD
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                triggerDownload(`${item.name}.txt`, toTxtContext(item.text), "text/plain;charset=utf-8");
                                pushActivity(l(`Скачан TXT: ${item.name}`, `Downloaded TXT: ${item.name}`));
                              }}
                              className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
                              title={`${t.download} TXT`}
                            >
                              <ArrowDownToLine className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditDialog({ mode: "context-item", value: item.text, item })}
                              className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
                              title={t.edit}
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                removeContextItems([item.id], item.name);
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
                    {t.source} <ExternalLink className="h-3 w-3" />
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
                <p className="text-xs text-muted-foreground">~{activePreview.tokenEstimate} {t.tokenSuffix}</p>
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
              <div className="space-y-2">{renderMessageBody(activePreview.text || t.noData)}</div>
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

      {editDialog && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setEditDialog(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-border bg-background"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
              <p className="text-sm font-semibold">
                {editDialog.mode === "history-rename" ? t.renameChatTitle : t.editContextTitle}
              </p>
              <button
                type="button"
                onClick={() => setEditDialog(null)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-muted"
              >
                <X className="h-3.5 w-3.5" />
                {t.close}
              </button>
            </div>
            <div className="p-4">
              {editDialog.mode === "history-rename" ? (
                <input
                  value={editDialog.value}
                  onChange={(event) => setEditDialog((prev) => (prev ? { ...prev, value: event.target.value } : prev))}
                  placeholder={t.renamePlaceholder}
                  autoFocus
                  className="h-10 w-full rounded-xl border border-border/70 bg-background px-3 text-sm outline-none focus:border-primary/40"
                />
              ) : (
                <textarea
                  value={editDialog.value}
                  onChange={(event) => setEditDialog((prev) => (prev ? { ...prev, value: event.target.value } : prev))}
                  placeholder={t.editPlaceholder}
                  autoFocus
                  rows={12}
                  className="w-full rounded-xl border border-border/70 bg-background p-3 text-sm outline-none focus:border-primary/40"
                />
              )}
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-border/70 px-4 py-3">
              <button
                type="button"
                onClick={() => setEditDialog(null)}
                className="inline-flex h-8 items-center rounded-lg border border-border/70 px-3 text-xs hover:bg-muted"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={submitEditDialog}
                disabled={!editDialog.value.trim()}
                className="inline-flex h-8 items-center rounded-lg border border-border/70 px-3 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
