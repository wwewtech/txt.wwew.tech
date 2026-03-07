"use client";

import * as React from "react";
import {
  Archive,
  ArrowDownToLine,
  Code2,
  Copy,
  Eye,
  Files,
  PanelLeftOpen,
  PanelRightOpen,
  Paperclip,
  Pencil,
  SendHorizontal,
  Trash2,
  Upload,
} from "lucide-react";

import { DragSegmented } from "@/components";
import { cn, type ParsedItem } from "@/lib";
import type { I18nDict } from "../model/page-constants";
import type { ActiveMode, ContextGroup, TimelineEntry } from "../model/page-types";

type HomeMainPanelProps = {
  t: I18nDict;
  leftCollapsed: boolean;
  rightSidebarOpen: boolean;
  totalTokens: number;
  activeChatTitle: string;
  markdownEnabled: boolean;
  activeMode: ActiveMode;
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
  onToggleMarkdown: () => void;
  onChangeActiveMode: (value: ActiveMode) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => Promise<void>;
  onPreviewItem: (item: ParsedItem) => void;
  onPreviewGroup: (group: ContextGroup, joinedText: string) => void;
  onCopy: (value: string) => Promise<boolean>;
  onToTxtContext: (content: string) => string;
  onPushActivity: (label: string) => void;
  l: (ruText: string, enText: string) => string;
  onTriggerDownload: (fileName: string, content: string, mime: string) => void;
  onEditContextGroup: (group: ContextGroup) => void;
  onRemoveContextItems: (ids: string[], label: string) => void;
  onFilePick: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onPromptChange: (value: string) => void;
  onSendPrompt: () => void;
  onExportTxt: () => void;
};

export function HomeMainPanel({
  t,
  leftCollapsed,
  rightSidebarOpen,
  totalTokens,
  activeChatTitle,
  markdownEnabled,
  activeMode,
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
  onToggleMarkdown,
  onChangeActiveMode,
  onDrop,
  onPreviewItem,
  onPreviewGroup,
  onCopy,
  onToTxtContext,
  onPushActivity,
  l,
  onTriggerDownload,
  onEditContextGroup,
  onRemoveContextItems,
  onFilePick,
  onPromptChange,
  onSendPrompt,
  onExportTxt,
}: HomeMainPanelProps) {
  return (
    <main className="flex h-screen min-h-screen flex-col overflow-hidden">
      {leftCollapsed && (
        <button
          type="button"
          onClick={onExpandLeft}
          className="fixed left-4 top-4 z-40 hidden h-8 w-8 items-center justify-center rounded-lg border border-border bg-background shadow-sm transition-colors hover:bg-muted md:left-6 md:top-6 xl:inline-flex"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}
      {!rightSidebarOpen && (
        <button
          type="button"
          onClick={onOpenRight}
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
              <DragSegmented
                value={activeMode}
                onValueChange={onChangeActiveMode}
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
                                onPreviewItem(group.items[0]);
                                return;
                              }

                              onPreviewGroup(group, joinedText);
                            }}
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-border/70 px-2 text-[11px] hover:bg-muted"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {t.previewAction}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const txt = onToTxtContext(joinedText);
                              await onCopy(txt);
                              onPushActivity(l(`Скопирован TXT: ${group.label}`, `Copied TXT: ${group.label}`));
                            }}
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-border/70 px-2 text-[11px] hover:bg-muted"
                          >
                            TXT
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await onCopy(joinedText);
                              onPushActivity(l(`Скопирован MD: ${group.label}`, `Copied MD: ${group.label}`));
                            }}
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-border/70 px-2 text-[11px] hover:bg-muted"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            MD
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onTriggerDownload(`${group.label}.md`, joinedText, "text/markdown;charset=utf-8");
                              onPushActivity(l(`Скачан MD: ${group.label}`, `Downloaded MD: ${group.label}`));
                            }}
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-border/70 px-2 text-[11px] hover:bg-muted"
                          >
                            <ArrowDownToLine className="h-3.5 w-3.5" />
                            {t.download}
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditContextGroup(group)}
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-border/70 px-2 text-[11px] hover:bg-muted"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            {t.edit}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              onRemoveContextItems(group.items.map((contextItem) => contextItem.id), group.label);
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
