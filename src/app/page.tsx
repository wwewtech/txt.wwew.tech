"use client";

import * as React from "react";
import {
  ArrowDownToLine,
  Bot,
  Copy,
  Files,
  ExternalLink,
  Eye,
  FileText,
  Github,
  Link as LinkIcon,
  Link2,
  MessageSquarePlus,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Pencil,
  Shield,
  Save,
  Share2,
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

const HISTORY_KEY = "txt-wwew-tech-history";

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
    if (anonymousMode) return;
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 30)));
  }, [history, anonymousMode]);

  const finalText = React.useMemo(
    () => combineToFinalTxt(items, prompt, mounted ? new Date().toISOString() : undefined),
    [items, prompt, mounted]
  );
  const totalTokens = React.useMemo(() => estimateTokens(finalText), [finalText]);

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
      try {
        const parsed = await Promise.all(
          incoming.map((entry) => parseFileWithPath(entry.file, entry.path, settings))
        );
        const clean = parsed.filter((item) => !item.error || item.error === "Skipped by filters");
        setItems((prev) => [...prev, ...clean]);
      } finally {
        setIsParsing(false);
      }
    },
    [settings]
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
    await navigator.clipboard.writeText(value);
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
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    const url = `${window.location.origin}${window.location.pathname}#shared=${encoded}`;
    await onCopy(url);
  };

  const exportTxt = () => {
    const blob = new Blob([finalText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `llm-context-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const startNewChat = () => {
    saveToHistory();
    setPrompt("");
    setItems([]);
    setCurrentChatId(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className={cn(
          "grid min-h-screen grid-cols-1",
          leftCollapsed
            ? "xl:grid-cols-[minmax(700px,1fr)_320px]"
            : "xl:grid-cols-[280px_minmax(700px,1fr)_320px]"
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
            <span>Новый чат</span>
          </button>

            <div className="min-h-0 w-full flex-1 overflow-auto rounded-2xl border border-border/70 bg-background/60 p-2">
              <p className="mb-2 px-2 text-xs uppercase tracking-wide text-muted-foreground">История</p>
              <div className="space-y-1">
                {history.length === 0 && (
                  <p className="px-2 py-1 text-xs text-muted-foreground">Записей пока нет</p>
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
                          title="Действия"
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
                          Сделать копию
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
                          Поделиться
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
                          Переименовать
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
                          Копировать prompt
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
                          Копировать итог
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
                          Удалить
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 w-full rounded-2xl border border-border/70 bg-background/80 p-3">
              <p className="mb-2 text-xs text-muted-foreground">Тема</p>
              <ThemeToggle />

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
                  Terms
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
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col p-4 md:p-6">
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="mb-4 rounded-3xl border border-dashed border-border/80 bg-muted/10 p-6"
            >
              <div className="mb-3 flex items-center justify-between">
                <h1 className="text-lg font-semibold tracking-tight">LLM Context Builder</h1>
                <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">
                  ~{totalTokens} tokens
                </span>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Добавьте инструкцию для LLM..."
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
                  Файлы
                </button>
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs hover:bg-muted"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Папка
                </button>
                <button
                  type="button"
                  onClick={() => saveToHistory(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs hover:bg-muted"
                >
                  <Save className="h-3.5 w-3.5" />
                  Сохранить
                </button>
                <button
                  type="button"
                  onClick={() => onCopy(finalText)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs hover:bg-muted"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Копировать итог
                </button>
                <button
                  type="button"
                  onClick={exportTxt}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 text-xs hover:bg-muted"
                >
                  <ArrowDownToLine className="h-3.5 w-3.5" />
                  Скачать .txt
                </button>
              </div>

              {isParsing && <p className="mt-3 text-xs text-muted-foreground">Парсинг файлов...</p>}
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
                      Превью
                    </button>
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((entry) => entry.id !== item.id))}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-muted"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Удалить
                    </button>
                    <button
                      type="button"
                      onClick={() => onCopy(item.text)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-muted"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Копировать
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-3xl border border-border/70 bg-background p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">Итоговый LLM-ready TXT</p>
                <span className="text-xs text-muted-foreground">{finalText.length.toLocaleString()} chars</span>
              </div>
              <pre className="max-h-80 overflow-auto rounded-2xl bg-muted/30 p-3 text-xs whitespace-pre-wrap">
                {finalText || "Добавьте файлы, чтобы увидеть итоговый контекст."}
              </pre>
            </div>
          </div>
        </main>

        <aside className="hidden border-l border-border/70 bg-muted/10 p-4 xl:block">
          <div className="mb-3 rounded-2xl border border-border/70 bg-background p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold">Privacy</p>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <button
              type="button"
              onClick={() => setAnonymousMode((v) => !v)}
              className={cn(
                "w-full rounded-xl border px-3 py-2 text-left text-xs",
                anonymousMode ? "border-primary bg-primary/10" : "border-border/70"
              )}
            >
              Анонимный чат: {anonymousMode ? "ON" : "OFF"}
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              В анонимном режиме ничего не сохраняется в localStorage.
            </p>
          </div>

          <div className="mb-3 rounded-2xl border border-border/70 bg-background p-3">
            <p className="mb-2 text-sm font-semibold">Фильтры</p>
            <label className="mb-1 block text-xs text-muted-foreground">Игнорировать папки</label>
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
              className="mb-3 min-h-20 w-full rounded-xl border border-border/70 bg-background p-2 text-xs"
            />
            <label className="mb-1 block text-xs text-muted-foreground">Исключить расширения (без точки)</label>
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
              className="min-h-20 w-full rounded-xl border border-border/70 bg-background p-2 text-xs"
            />
          </div>

          <div className="rounded-2xl border border-border/70 bg-background p-3 text-xs text-muted-foreground">
            <p className="mb-2 text-sm font-semibold text-foreground">Подсказки UX</p>
            <p className="mb-1">• Drag & Drop работает прямо в центральной зоне.</p>
            <p className="mb-1">• ZIP и DOCX/PDF парсятся на клиенте.</p>
            <p className="mb-1">• Нажмите на карточку файла для превью и копирования.</p>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-foreground">
              Source <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </aside>
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
                  Копировать
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
                  Удалить
                </button>
                <button
                  type="button"
                  onClick={() => setActivePreview(null)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-muted"
                >
                  <X className="h-3.5 w-3.5" />
                  Закрыть
                </button>
              </div>
            </div>
            <div className="preview-scroll min-h-0 flex-1 overflow-auto p-4">
              <pre className="text-xs whitespace-pre-wrap">{activePreview.text || "Нет данных"}</pre>
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
                Вниз
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
