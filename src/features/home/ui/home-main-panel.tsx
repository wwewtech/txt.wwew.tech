"use client";

import * as React from "react";
import {
  Archive,
  ArrowDownToLine,
  Code2,
  Copy,
  Eye,
  Files,
  Menu,
  PanelLeftOpen,
  PanelRightOpen,
  Paperclip,
  Pencil,
  SendHorizontal,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";

import { cn, type ParsedItem } from "@/lib";
import type { I18nDict } from "../model/page-constants";
import type { ContextGroup, TimelineEntry } from "../model/page-types";

type HomeMainPanelProps = {
  t: I18nDict;
  leftCollapsed: boolean;
  rightSidebarOpen: boolean;
  totalTokens: number;
  markdownEnabled: boolean;
  timelineEntries: TimelineEntry[];
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
  onFilePick: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onPromptChange: (value: string) => void;
  onSendPrompt: () => void;
  onExportTxt: () => void;
};

const ITEM_ACTION_BUTTON_CLASS =
  "inline-flex h-7 items-center gap-1 rounded-lg border border-border/70 px-2 text-[11px] hover:bg-muted";
const GROUP_META_CHIP_CLASS = "rounded-md border border-border/60 px-2 py-1";

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
  onToTxtContext,
  onPushActivity,
  l,
  onTriggerDownload,
  onEditContextGroup,
  onEditContextItem,
  onRemoveContextItems,
  onFilePick,
  onPromptChange,
  onSendPrompt,
  onExportTxt,
}: HomeMainPanelProps) {
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight">{t.builderTitle}</span>
                <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] text-muted-foreground">
                  ~{totalTokens} {t.tokenSuffix}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleMarkdown}
                className={cn(
                  "inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-xs",
                  markdownEnabled ? "border-primary/40 bg-primary/10" : "border-border/70 bg-background"
                )}
              >
                <Code2 className="h-3.5 w-3.5" />
                {markdownEnabled ? t.markdownOn : t.raw}
              </button>
            </div>
          </div>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={(event) => event.preventDefault()}
          className="min-h-0 flex-1 overflow-hidden rounded-2xl bg-muted/15"
        >
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
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
                  const isSingleItemGroup = group.items.length === 1;
                  const singleItem = isSingleItemGroup ? group.items[0] : null;
                  const showHeaderPath = Boolean(group.path) && group.path !== group.label;
                  const joinedText = group.items.map((item) => item.text).filter(Boolean).join("\n\n");

                  return (
                    <div key={entry.id} className="group rounded-2xl border border-border/50 bg-background/85 p-3">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{group.label}</p>
                          {showHeaderPath && <p className="truncate text-xs text-muted-foreground">{group.path}</p>}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          {group.kind === "archive" ? <Archive className="h-3.5 w-3.5" /> : <Files className="h-3.5 w-3.5" />}
                          <span>~{group.tokenEstimate} {t.tokenSuffix}</span>
                        </div>
                      </div>

                      {(!isSingleItemGroup || group.kind !== "file") && (
                        <div className="mb-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                          <span className={GROUP_META_CHIP_CLASS}>{t.fileCount}: {group.fileCount}</span>
                          <span className={GROUP_META_CHIP_CLASS}>{t.folderCount}: {group.folderCount}</span>
                          <span className={GROUP_META_CHIP_CLASS}>{bytesToText(group.size)}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          {!isSingleItemGroup && (
                            <p className="truncate text-xs text-muted-foreground">
                              {group.kind === "archive"
                                ? `${t.archiveParsed}: ${group.fileCount} ${t.fileCount}`
                                : group.kind === "folder"
                                  ? `${t.folderStructure}: ${group.label}`
                                  : t.singleFile}
                            </p>
                          )}
                          {group.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onPreviewGroup(group, joinedText)}
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-border/70 px-2 text-[11px] hover:bg-muted"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              {t.previewAction}
                            </button>
                          )}
                        </div>

                        {isSingleItemGroup && singleItem ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {[
                              {
                                key: "preview",
                                label: t.previewAction,
                                icon: <Eye className="h-3.5 w-3.5" />,
                                onClick: () => onPreviewItem(singleItem),
                              },
                              {
                                key: "txt",
                                label: "TXT",
                                onClick: async () => {
                                  const txt = onToTxtContext(singleItem.text);
                                  await onCopy(txt);
                                  onPushActivity(l(`Скопирован TXT: ${singleItem.name}`, `Copied TXT: ${singleItem.name}`));
                                },
                              },
                              {
                                key: "md",
                                label: "MD",
                                icon: <Copy className="h-3.5 w-3.5" />,
                                onClick: async () => {
                                  await onCopy(singleItem.text);
                                  onPushActivity(l(`Скопирован MD: ${singleItem.name}`, `Copied MD: ${singleItem.name}`));
                                },
                              },
                              {
                                key: "download",
                                label: t.download,
                                icon: <ArrowDownToLine className="h-3.5 w-3.5" />,
                                onClick: () => {
                                  onTriggerDownload(`${singleItem.name}.md`, singleItem.text, "text/markdown;charset=utf-8");
                                  onPushActivity(l(`Скачан MD: ${singleItem.name}`, `Downloaded MD: ${singleItem.name}`));
                                },
                              },
                              {
                                key: "edit",
                                label: t.edit,
                                icon: <Pencil className="h-3.5 w-3.5" />,
                                onClick: () => onEditContextItem(singleItem),
                              },
                              {
                                key: "delete",
                                label: t.delete,
                                icon: <Trash2 className="h-3.5 w-3.5" />,
                                onClick: () => onRemoveContextItems([singleItem.id], singleItem.name),
                              },
                            ].map((action) => (
                              <button
                                key={`${singleItem.id}-${action.key}`}
                                type="button"
                                onClick={action.onClick}
                                className={ITEM_ACTION_BUTTON_CLASS}
                              >
                                {action.icon}
                                {action.label}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1.5 border-l border-border/50 pl-2">
                            {group.items.map((item) => {
                              const itemActions: Array<{
                                key: string;
                                label: string;
                                icon?: React.ReactNode;
                                onClick: () => void | Promise<void>;
                              }> = [
                                {
                                  key: "preview",
                                  label: t.previewAction,
                                  icon: <Eye className="h-3.5 w-3.5" />,
                                  onClick: () => onPreviewItem(item),
                                },
                                {
                                  key: "txt",
                                  label: "TXT",
                                  onClick: async () => {
                                    const txt = onToTxtContext(item.text);
                                    await onCopy(txt);
                                    onPushActivity(l(`Скопирован TXT: ${item.name}`, `Copied TXT: ${item.name}`));
                                  },
                                },
                                {
                                  key: "md",
                                  label: "MD",
                                  icon: <Copy className="h-3.5 w-3.5" />,
                                  onClick: async () => {
                                    await onCopy(item.text);
                                    onPushActivity(l(`Скопирован MD: ${item.name}`, `Copied MD: ${item.name}`));
                                  },
                                },
                                {
                                  key: "download",
                                  label: t.download,
                                  icon: <ArrowDownToLine className="h-3.5 w-3.5" />,
                                  onClick: () => {
                                    onTriggerDownload(`${item.name}.md`, item.text, "text/markdown;charset=utf-8");
                                    onPushActivity(l(`Скачан MD: ${item.name}`, `Downloaded MD: ${item.name}`));
                                  },
                                },
                                {
                                  key: "edit",
                                  label: t.edit,
                                  icon: <Pencil className="h-3.5 w-3.5" />,
                                  onClick: () => onEditContextItem(item),
                                },
                                {
                                  key: "delete",
                                  label: t.delete,
                                  icon: <Trash2 className="h-3.5 w-3.5" />,
                                  onClick: () => onRemoveContextItems([item.id], item.name),
                                },
                              ];

                              return (
                                <div
                                  key={item.id}
                                  className="rounded-xl border border-border/40 bg-background/70 px-2.5 py-2"
                                >
                                  <div className="mb-1.5 flex items-center justify-between gap-2">
                                    <p className="truncate text-xs font-medium">{item.name}</p>
                                    <span className="shrink-0 rounded-full border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                      ~{item.tokenEstimate} {t.tokenSuffix}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-1.5">
                                    <p className="max-w-full truncate text-[11px] text-muted-foreground">{item.path}</p>
                                    <div className="flex flex-wrap items-center gap-1">
                                      {itemActions.map((action) => (
                                        <button
                                          key={`${item.id}-${action.key}`}
                                          type="button"
                                          onClick={action.onClick}
                                          className={ITEM_ACTION_BUTTON_CLASS}
                                        >
                                          {action.icon}
                                          {action.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {group.items.length > 1 && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => onEditContextGroup(group)}
                              className={`${ITEM_ACTION_BUTTON_CLASS} text-muted-foreground`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              {l("Изменить весь контекст", "Edit all context")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-border/40 bg-background/90 p-3 md:p-4">
              <div className="mx-auto flex w-full max-w-3xl items-end gap-2 rounded-2xl border border-border/50 bg-background px-3 py-2">
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
                  onChange={(event) => onPromptChange(event.target.value)}
                  placeholder={t.typingPlaceholder}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      onSendPrompt();
                    }
                  }}
                  className="max-h-56 min-h-14 w-full resize-none overflow-y-auto rounded-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none"
                />

                <div className="flex shrink-0 items-center gap-2 pb-1">
                  <button
                    type="button"
                    onClick={onExportTxt}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 hover:bg-muted"
                    title={t.downloadTxt}
                  >
                    <ArrowDownToLine className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={onSendPrompt}
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
  );
}
