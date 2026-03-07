"use client";

import {
  ArrowDownToLine,
  CheckCheck,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  Grid3X3,
  ChevronsUpDown,
  ListFilter,
  Loader2,
  PanelRightClose,
  Pencil,
  Search,
  Shield,
  Sparkles,
  Star,
  Trash2,
  WandSparkles,
} from "lucide-react";

import { cn, type ParsedItem } from "@/lib";
import type { I18nDict } from "../model/page-constants";
import type { ActivityItem, SortMode, ViewMode } from "../model/page-types";

type HomeRightSidebarProps = {
  t: I18nDict;
  rightSidebarWidth: number;
  items: ParsedItem[];
  processing: boolean;
  promptSuggestions: string[];
  bundleFilter: string;
  sortMode: SortMode;
  viewMode: ViewMode;
  visibleItems: ParsedItem[];
  selectedItems: ParsedItem[];
  skippedFiles: number;
  selectedItemIds: string[];
  favoriteItemIds: string[];
  totalFiles: number;
  totalBytes: number;
  totalTokens: number;
  activity: ActivityItem[];
  autoSaveEnabled: boolean;
  anonymousMode: boolean;
  includePromptInResult: boolean;
  showSkippedFiles: boolean;
  settings: {
    ignoredDirectories: string[];
    excludedExtensions: string[];
  };
  onCloseRight: () => void;
  onSetBundleFilter: (value: string) => void;
  onSetSortMode: (value: SortMode) => void;
  onSetViewMode: (value: ViewMode) => void;
  onSelectAllVisible: () => void;
  onBuildSelected: () => Promise<void>;
  onRemoveSelected: () => void;
  onAddPromptSuggestion: (value: string) => void;
  onQuickBuild: () => Promise<void>;
  onCopyDraft: () => Promise<void>;
  onToggleSelectItem: (id: string) => void;
  onToggleFavoriteItem: (id: string) => void;
  onPreviewItem: (item: ParsedItem) => void;
  onCopyItemTxt: (item: ParsedItem) => Promise<void>;
  onCopyItemMd: (item: ParsedItem) => Promise<void>;
  onDownloadItemTxt: (item: ParsedItem) => void;
  onEditItem: (item: ParsedItem) => void;
  onRemoveItem: (item: ParsedItem) => void;
  onToggleAutoSave: () => void;
  onToggleAnonymousMode: () => void;
  onSetIgnoredDirectories: (value: string) => void;
  onSetExcludedExtensions: (value: string) => void;
  onSetIncludePromptInResult: (value: boolean) => void;
  onSetShowSkippedFiles: (value: boolean) => void;
  onBytesToText: (value: number) => string;
};

export function HomeRightSidebar({
  t,
  rightSidebarWidth,
  items,
  processing,
  promptSuggestions,
  bundleFilter,
  sortMode,
  viewMode,
  visibleItems,
  selectedItems,
  skippedFiles,
  selectedItemIds,
  favoriteItemIds,
  totalFiles,
  totalBytes,
  totalTokens,
  activity,
  autoSaveEnabled,
  anonymousMode,
  includePromptInResult,
  showSkippedFiles,
  settings,
  onCloseRight,
  onSetBundleFilter,
  onSetSortMode,
  onSetViewMode,
  onSelectAllVisible,
  onBuildSelected,
  onRemoveSelected,
  onAddPromptSuggestion,
  onQuickBuild,
  onCopyDraft,
  onToggleSelectItem,
  onToggleFavoriteItem,
  onPreviewItem,
  onCopyItemTxt,
  onCopyItemMd,
  onDownloadItemTxt,
  onEditItem,
  onRemoveItem,
  onToggleAutoSave,
  onToggleAnonymousMode,
  onSetIgnoredDirectories,
  onSetExcludedExtensions,
  onSetIncludePromptInResult,
  onSetShowSkippedFiles,
  onBytesToText,
}: HomeRightSidebarProps) {
  return (
    <aside
      className="hidden h-screen border-l border-border/50 bg-background/90 xl:sticky xl:top-0 xl:block"
      style={{ width: `${rightSidebarWidth}px` }}
    >
      <div className="p-3 pb-0">
        <div className="mb-3 border-b border-border/40 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold tracking-tight">{t.settings}</p>
              <p className="text-xs text-muted-foreground">{t.settingsSubtitle}</p>
            </div>
            <button
              type="button"
              onClick={onCloseRight}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background hover:bg-muted"
              title={t.closeRight}
            >
              <PanelRightClose className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="h-[calc(100vh-6.75rem)] space-y-3 overflow-auto p-3 pt-0">
        <div className="rounded-xl bg-muted/25 p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold">{t.quickPrompts}</p>
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {promptSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onAddPromptSuggestion(item)}
                className="rounded-full border border-border/60 bg-background/70 px-2 py-1 text-[10px] hover:bg-muted"
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={onQuickBuild}
              disabled={processing || !items.length}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border/60 bg-background/70 px-2 text-[10px] hover:bg-muted disabled:opacity-40"
            >
              <WandSparkles className="h-3 w-3" /> {t.build}
            </button>
            <button
              type="button"
              onClick={onCopyDraft}
              disabled={!items.length}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border/60 bg-background/70 px-2 text-[10px] hover:bg-muted disabled:opacity-40"
            >
              <Copy className="h-3 w-3" /> {t.draft}
            </button>
          </div>
        </div>

        {(items.length > 0 || processing) && (
          <div className="rounded-xl bg-muted/25 p-2.5">
          {items.length > 0 && (
            <>
              <p className="mb-1 text-[10px] text-muted-foreground">{t.searchHint}</p>
              <div className="mb-2 grid grid-cols-[1fr_auto] gap-1.5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={bundleFilter}
                    onChange={(event) => onSetBundleFilter(event.target.value)}
                    placeholder={t.filter}
                    className="h-8 w-full rounded-md border border-border/70 bg-background pl-7 pr-2 text-[11px]"
                  />
                </div>
                <select
                  value={sortMode}
                  onChange={(event) => onSetSortMode(event.target.value as SortMode)}
                  className="h-8 min-w-24 rounded-md border border-border/60 bg-background px-2 text-[11px]"
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
                  onClick={() => onSetViewMode("cards")}
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/70",
                    viewMode === "cards" ? "bg-muted" : "bg-background/80"
                  )}
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onSetViewMode("compact")}
                  className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/70",
                    viewMode === "compact" ? "bg-muted" : "bg-background/80"
                  )}
                >
                  <ChevronsUpDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onSelectAllVisible}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-border/60 bg-background/80 px-2 text-[10px] hover:bg-muted"
                >
                  <CheckCheck className="h-3 w-3" /> {t.visible}
                </button>
              </div>

              <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="rounded-md border border-border/60 bg-background/70 px-1.5 py-0.5">{t.visible}: {visibleItems.length}</span>
                <span className="rounded-md border border-border/60 bg-background/70 px-1.5 py-0.5">{t.selected}: {selectedItems.length}</span>
                <span className="rounded-md border border-border/60 bg-background/70 px-1.5 py-0.5">{t.skipped}: {skippedFiles}</span>
              </div>

              <div className="mb-2 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={onBuildSelected}
                  disabled={!selectedItems.length}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-border/60 bg-background/80 px-2 text-[10px] hover:bg-muted disabled:opacity-40"
                >
                  <ListFilter className="h-3 w-3" /> {t.buildSelected}
                </button>
                <button
                  type="button"
                  onClick={onRemoveSelected}
                  disabled={!selectedItems.length}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-border/60 bg-background/80 px-2 text-[10px] hover:bg-muted disabled:opacity-40"
                >
                  <Trash2 className="h-3 w-3" /> {t.remove}
                </button>
              </div>
            </>
          )}

          {items.length > 0 && (
            <div className={cn("max-h-60 overflow-auto", viewMode === "cards" ? "space-y-1.5" : "space-y-1")}>
              {visibleItems.map((item) => {
                const isSelected = selectedItemIds.includes(item.id);
                const isFavorite = favoriteItemIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-lg border border-border/50 bg-background/90 px-2 py-1.5",
                      isSelected && "border-primary/40 bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectItem(item.id)}
                        className="h-3.5 w-3.5"
                      />
                      <p className="min-w-0 flex-1 truncate text-[11px] font-medium">{item.name}</p>
                      <span className="text-[10px] text-muted-foreground">{item.tokenEstimate}</span>
                      <button
                        type="button"
                        onClick={() => onToggleFavoriteItem(item.id)}
                        className={cn("inline-flex h-5 w-5 items-center justify-center rounded", isFavorite && "bg-muted")}
                      >
                        <Star className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onPreviewItem(item)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onCopyItemTxt(item);
                        }}
                        className="inline-flex h-5 items-center justify-center rounded px-1.5 text-[10px] hover:bg-muted"
                      >
                        TXT
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onCopyItemMd(item);
                        }}
                        className="inline-flex h-5 items-center justify-center rounded px-1.5 text-[10px] hover:bg-muted"
                      >
                        MD
                      </button>
                      <button
                        type="button"
                        onClick={() => onDownloadItemTxt(item)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
                        title={`${t.download} TXT`}
                      >
                        <ArrowDownToLine className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onEditItem(item)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
                        title={t.edit}
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item)}
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
        )}

        <div className="rounded-xl bg-muted/25 p-2.5">
          <p className="mb-1 text-[11px] font-semibold">{t.workspace}</p>
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div className="rounded-md border border-border/50 bg-background/80 px-2 py-1.5">{t.sources}: {items.length}</div>
            <div className="rounded-md border border-border/50 bg-background/80 px-2 py-1.5">{t.files}: {totalFiles}</div>
            <div className="rounded-md border border-border/50 bg-background/80 px-2 py-1.5">{t.size}: {onBytesToText(totalBytes)}</div>
            <div className="rounded-md border border-border/50 bg-background/80 px-2 py-1.5">{t.tokens}: ~{totalTokens}</div>
          </div>
        </div>

        <div className="rounded-xl bg-muted/25 p-2.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold">{t.privacy}</p>
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={onToggleAutoSave}
              className={cn(
                "flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-[10px] transition-colors",
                autoSaveEnabled ? "border-primary/50 bg-primary/10" : "border-border/70 hover:bg-muted"
              )}
              aria-pressed={autoSaveEnabled}
            >
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    autoSaveEnabled ? "bg-primary" : "bg-muted-foreground/60"
                  )}
                  aria-hidden="true"
                />
                {t.autosave}
              </span>
              <span
                className={cn(
                  "rounded-full border px-1.5 py-0.5 text-[9px] font-semibold leading-none",
                  autoSaveEnabled ? "border-primary/40 bg-primary/15 text-primary" : "border-border/70 text-muted-foreground"
                )}
              >
                {autoSaveEnabled ? "ON" : "OFF"}
              </span>
              <span className="sr-only">{t.autosave}: {autoSaveEnabled ? "ON" : "OFF"}</span>
            </button>

            <button
              type="button"
              onClick={onToggleAnonymousMode}
              className={cn(
                "flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-[10px] transition-colors",
                anonymousMode ? "border-primary/50 bg-primary/10" : "border-border/70 hover:bg-muted"
              )}
              aria-pressed={anonymousMode}
            >
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    anonymousMode ? "bg-primary" : "bg-muted-foreground/60"
                  )}
                  aria-hidden="true"
                />
                {t.anonymous}
              </span>
              <span
                className={cn(
                  "rounded-full border px-1.5 py-0.5 text-[9px] font-semibold leading-none",
                  anonymousMode ? "border-primary/40 bg-primary/15 text-primary" : "border-border/70 text-muted-foreground"
                )}
              >
                {anonymousMode ? "ON" : "OFF"}
              </span>
              <span className="sr-only">{t.anonymous}: {anonymousMode ? "ON" : "OFF"}</span>
            </button>
          </div>
        </div>

        <details className="group rounded-xl bg-muted/25 p-2.5" open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-semibold">
            {t.output}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 space-y-1.5 text-[10px]">
            <label className="flex items-center justify-between rounded-md border border-border/60 bg-background/80 px-2 py-1.5">
              {t.includePrompt}
              <input
                type="checkbox"
                checked={includePromptInResult}
                onChange={(event) => onSetIncludePromptInResult(event.target.checked)}
              />
            </label>
            <label className="flex items-center justify-between rounded-md border border-border/60 bg-background/80 px-2 py-1.5">
              {t.showSkipped}
              <input
                type="checkbox"
                checked={showSkippedFiles}
                onChange={(event) => onSetShowSkippedFiles(event.target.checked)}
              />
            </label>
          </div>
        </details>

        <details className="group rounded-xl bg-muted/25 p-2.5">
          <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-semibold">
            {t.parser}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2">
            <label className="mb-1 block text-[10px] text-muted-foreground">{t.ignoredDirs}</label>
            <textarea
              value={settings.ignoredDirectories.join(",")}
              onChange={(event) => onSetIgnoredDirectories(event.target.value)}
              className="mb-1.5 min-h-14 w-full rounded-md border border-border/60 bg-background p-1.5 text-[10px]"
            />
            <label className="mb-1 block text-[10px] text-muted-foreground">{t.excludedExt}</label>
            <textarea
              value={settings.excludedExtensions.join(",")}
              onChange={(event) => onSetExcludedExtensions(event.target.value)}
              className="min-h-14 w-full rounded-md border border-border/60 bg-background p-1.5 text-[10px]"
            />
          </div>
        </details>

        <details className="group rounded-xl bg-muted/25 p-2.5 text-[10px]">
          <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
            {t.activity}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2">
            <div className="mb-1.5 flex items-center justify-end">
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
                <div key={item.id} className="rounded-md border border-border/60 bg-background/80 px-2 py-1.5">
                  <p>{item.label}</p>
                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                    {new Date(item.at).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </details>
      </div>
    </aside>
  );
}
