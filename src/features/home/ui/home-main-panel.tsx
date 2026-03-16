"use client";

import * as React from "react";
import {
  Archive,
  ArrowUp,
  Code2,
  Copy,
  Eye,
  FileDown,
  Files,
  FolderOpen,
  Menu,
  MoreVertical,
  PanelLeftOpen,
  PanelRightOpen,
  Paperclip,
  Pencil,
  Save,
  Settings,
  Trash2,
} from "lucide-react";

import { cn, type ParsedItem } from "@/lib";
import type { I18nDict } from "../model/page-constants";
import type { ContextGroup, HistoryItem, TimelineEntry } from "../model/page-types";

type HomeMainPanelProps = {
  t: I18nDict;
  leftCollapsed: boolean;
  rightSidebarOpen: boolean;
  totalTokens: number;
  markdownEnabled: boolean;
  timelineEntries: TimelineEntry[];
  history: HistoryItem[];
  currentChatId: string | null;
  prompt: string;
  isParsing: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  folderInputRef: React.RefObject<HTMLInputElement | null>;
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
  renderMessageBody: (content: string) => React.ReactNode;
  bytesToText: (value: number) => string;
  onExpandLeft: () => void;
  onOpenRight: () => void;
  onOpenMobileLeft: () => void;
  onOpenMobileRight: () => void;
  onToggleMarkdown: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => Promise<void>;
  onPreviewItem: (item: ParsedItem) => void;
  onPreviewGroup: (group: ContextGroup, joinedText: string) => void;
  onCopy: (value: string) => Promise<boolean>;
  onToTxtContext: (content: string) => string;
  onPushActivity: (label: string) => void;
  l: (ruText: string, enText: string) => string;
  onTriggerDownload: (fileName: string, content: string, mime: string) => void;
  onEditContextGroup: (group: ContextGroup) => void;
  onEditContextItem: (item: ParsedItem) => void;
  onRemoveContextItems: (ids: string[], label: string) => void;
  onRemoveMessage: (id: string) => void;
  onFilePick: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onPromptChange: (value: string) => void;
  onSendPrompt: () => void;
  onExportTxt: () => void;
  onManualSave: () => Promise<void>;
  onSelectHistory: (entry: HistoryItem) => void;
  scrollOnSend: boolean;
  sendKey: 'enter' | 'shift+enter';
};


export function HomeMainPanel({
  t,
  leftCollapsed,
  rightSidebarOpen,
  totalTokens,
  markdownEnabled,
  timelineEntries,
  prompt,
  isParsing,
  fileInputRef,
  folderInputRef,
  composerRef,
  renderMessageBody,
  bytesToText,
  onExpandLeft,
  onOpenRight,
  onOpenMobileLeft,
  onOpenMobileRight,
  onToggleMarkdown,
  onDrop,
  onPreviewItem,
  onPreviewGroup,
  onCopy,
  onPushActivity,
  l,
  onTriggerDownload,
  onEditContextGroup,
  onEditContextItem,
  onRemoveContextItems,
  onRemoveMessage,
  onFilePick,
  onPromptChange,
  onSendPrompt,
  onExportTxt,
  onManualSave,
  onSelectHistory,
  history,
  currentChatId,
  scrollOnSend,
  sendKey,
}: HomeMainPanelProps) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<string | null>(null);

  const currentHistoryEntry = React.useMemo(
    () => history.find((entry) => entry.id === currentChatId),
    [history, currentChatId]
  );

  React.useEffect(() => {
    if (!menuOpen) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || menuButtonRef.current?.contains(target)) {
        return;
      }
      setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleManualSave = React.useCallback(async () => {
    setIsSaving(true);
    try {
      await onManualSave();
      setLastSavedAt(new Date().toLocaleTimeString());
    } finally {
      setIsSaving(false);
    }
  }, [onManualSave]);

  const handleSend = React.useCallback(() => {
    onSendPrompt();
    if (scrollOnSend) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [onSendPrompt, scrollOnSend]);

  return (
    <main className="flex h-screen min-h-screen flex-col overflow-hidden">
      {/* Desktop expand buttons */}
      {leftCollapsed && (
        <button
          type="button"
          onClick={onExpandLeft}
          className="fixed left-4 top-4 z-40 hidden h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background transition-colors hover:bg-muted md:left-6 md:top-6 xl:inline-flex"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}
      {!rightSidebarOpen && (
        <button
          type="button"
          onClick={onOpenRight}
          className="fixed right-4 top-4 z-40 hidden h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background transition-colors hover:bg-muted md:right-6 md:top-6 xl:inline-flex"
          title={t.openRight}
          aria-label={t.activity}
        >
          <PanelRightOpen className="h-4 w-4" />
        </button>
      )}

      {/* Mobile header — only visible on < xl */}
      <header className="flex items-center justify-between border-b border-border/40 bg-background/95 px-4 py-2 xl:hidden">
        <button
          type="button"
          onClick={onOpenMobileLeft}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 hover:bg-muted"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold tracking-tight">txt.wwew.tech</span>
        <button
          type="button"
          onClick={onOpenMobileRight}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 hover:bg-muted"
          aria-label="Open settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      <div className="mx-auto flex h-full w-full max-w-4xl flex-1 flex-col overflow-hidden px-3 py-3 md:px-6 md:py-6">
        <div className="mb-3 border-b border-border/40 px-1 pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight">
                {currentHistoryEntry?.title ?? t.history}
              </span>
              <span className="rounded-full border border-border/70 bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
                {totalTokens} {t.tokenSuffix}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button type="button" onClick={handleManualSave} className="sr-only">
                {t.manualSaveChatNow}
              </button>

              <div className="relative">
                <button
                  ref={menuButtonRef}
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70 bg-background hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/60",
                    menuOpen && "border-primary/60 bg-primary/10"
                  )}
                  title={t.actions}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {menuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-border/70 bg-background shadow-lg"
                  >
                    <div className="border-b border-border/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
                      {t.actions}
                    </div>
                    <div className="flex flex-col gap-px">
                      <button
                        type="button"
                        onClick={() => {
                          handleManualSave();
                          setMenuOpen(false);
                        }}
                        disabled={isSaving}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        <span>{t.save}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onToggleMarkdown();
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] hover:bg-muted"
                      >
                        <Code2 className="h-4 w-4" />
                        <span>{markdownEnabled ? t.markdownOn : t.markdownOFF}</span>
                      </button>
                      <div className="border-t border-border/50" />
                      <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground">
                        {t.history}
                      </div>
                      {history.length === 0 ? (
                        <div className="px-3 py-2 text-[11px] text-muted-foreground">{t.noEntries}</div>
                      ) : (
                        history.slice(0, 5).map((entry) => (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => {
                              onSelectHistory(entry);
                              setMenuOpen(false);
                            }}
                            className="flex w-full items-center justify-between gap-2 border-t border-border/50 px-3 py-2 text-left text-[11px] hover:bg-muted"
                          >
                            <span className="truncate font-medium text-foreground">{entry.title}</span>
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {new Date(entry.updatedAt).toLocaleTimeString()}
                            </span>
                          </button>
                        ))
                      )}
                      <div className="border-t border-border/50" />
                      <button
                        type="button"
                        onClick={() => {
                          onExpandLeft();
                          setMenuOpen(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] hover:bg-muted"
                      >
                        <Archive className="h-4 w-4" />
                        <span>{t.history}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {lastSavedAt && (
                  <span className="text-[10px] text-muted-foreground">{t.savedAt}: {lastSavedAt}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={(event) => event.preventDefault()}
          className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-muted/15"
        >
          <div className="flex h-full flex-col">
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
                {timelineEntries.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-background/70 px-4 py-6 text-center text-sm text-muted-foreground">
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
                          "group relative w-full rounded-2xl border px-4 py-3",
                          message.role === "user"
                            ? "ml-auto border-border/70 bg-background"
                            : "mr-auto border-primary/20 bg-primary/5"
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={async () => {
                                  await onCopy(message.content);
                                  onPushActivity(l("Скопировано", "Copied"));
                                }}
                                className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-foreground/10"
                                title={l("Копировать", "Copy")}
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onRemoveMessage(message.id)}
                                className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-destructive"
                                title={t.delete}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                            <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                          </div>
                        </div>
                        <div className="space-y-2 wrap-anywhere">{renderMessageBody(message.content)}</div>
                      </div>
                    );
                  }

                  const group = entry.group;
                  const isSingleItemGroup = group.items.length === 1;
                  const singleItem = isSingleItemGroup ? group.items[0] : null;
                  const joinedText = group.items.map((item) => item.text).filter(Boolean).join("\n\n");

                  return (
                    <div key={entry.id} id={entry.id} className="group/card rounded-2xl border border-border/50 bg-background/85 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <div className="shrink-0 text-muted-foreground">
                            {group.kind === "archive" ? <Archive className="h-4 w-4" /> : <Files className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{group.label}</p>
                            <p className="text-[11px] text-muted-foreground">
                              {group.tokenEstimate} {t.tokenSuffix}
                              {!isSingleItemGroup && <> · {group.fileCount} {t.fileCount}</>}
                              {" · "}{bytesToText(group.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover/card:opacity-100">
                          <button
                            type="button"
                            onClick={isSingleItemGroup && singleItem ? () => onPreviewItem(singleItem) : () => onPreviewGroup(group, joinedText)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            title={t.previewAction}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const text = singleItem ? singleItem.text : joinedText;
                              await onCopy(text);
                              onPushActivity(l(`Скопирован MD: ${group.label}`, `Copied MD: ${group.label}`));
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            title="Copy MD"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const text = singleItem ? singleItem.text : joinedText;
                              onTriggerDownload(`${group.label}.md`, text, "text/markdown;charset=utf-8");
                              onPushActivity(l(`Скачан MD: ${group.label}`, `Downloaded MD: ${group.label}`));
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            title={t.download}
                          >
                            <FileDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={isSingleItemGroup && singleItem ? () => onEditContextItem(singleItem) : () => onEditContextGroup(group)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                            title={t.edit}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveContextItems(group.items.map((i) => i.id), group.label)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-foreground/10 text-muted-foreground hover:text-destructive"
                            title={t.delete}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {!isSingleItemGroup && (
                        <div className="mt-2 divide-y divide-border/40 overflow-hidden rounded-xl border border-border/40">
                          {group.items.map((item) => (
                            <div key={item.id} className="group/item flex items-center gap-2 px-3 py-1.5 hover:bg-muted/30">
                              <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{item.name}</span>
                              <span className="shrink-0 text-[10px] text-muted-foreground transition-opacity group-hover/item:opacity-0">{item.tokenEstimate} {t.tokenSuffix}</span>
                              <button
                                type="button"
                                onClick={() => onRemoveContextItems([item.id], item.name)}
                                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover/item:opacity-100 hover:bg-foreground/10 text-muted-foreground hover:text-destructive"
                                title={t.delete}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-3 pb-4 pt-2 md:px-6 md:pb-5">
              <div className="mx-auto w-full max-w-3xl">
                <input ref={fileInputRef} type="file" multiple onChange={onFilePick} className="hidden" />
                <input
                  ref={folderInputRef}
                  type="file"
                  multiple
                  onChange={onFilePick}
                  className="hidden"
                  {...({ webkitdirectory: "", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>)}
                />
                <div className="rounded-xl border border-border bg-card ring-0">
                  <textarea
                    ref={composerRef}
                    value={prompt}
                    onChange={(event) => onPromptChange(event.target.value)}
                    placeholder={t.typingPlaceholder}
                    onKeyDown={(event) => {
                      const shouldSend =
                        sendKey === 'enter'
                          ? event.key === 'Enter' && !event.shiftKey
                          : event.key === 'Enter' && event.shiftKey;
                      if (shouldSend) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                    className="min-h-16 max-h-52 w-full resize-none overflow-y-auto bg-transparent px-3.5 pt-3.5 pb-2 text-sm leading-relaxed outline-none [box-shadow:none] placeholder:text-muted-foreground/40"
                  />
                  <div className="flex items-center px-2 pb-2">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title={t.uploadFiles}
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        {l("Файлы", "Files")}
                      </button>
                      <button
                        type="button"
                        onClick={() => folderInputRef.current?.click()}
                        className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title={t.uploadFolder}
                      >
                        <FolderOpen className="h-3.5 w-3.5" />
                        {l("Папка", "Folder")}
                      </button>
                    </div>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={onExportTxt}
                        className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        title={t.downloadTxt}
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        {l("Экспорт", "Export")}
                      </button>
                      <button
                        type="button"
                        onClick={handleSend}
                        disabled={!prompt.trim()}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background transition-opacity hover:opacity-75 disabled:opacity-30"
                        title={t.send}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
                {isParsing && <p className="mt-2 text-xs text-muted-foreground/70">{t.parsing}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
