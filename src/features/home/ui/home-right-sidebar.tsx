"use client";

import * as React from "react";
import {
  ArrowRight,
  CheckCheck,
  CheckCircle,
  ChevronDown,
  ExternalLink,
  Grid3X3,
  ChevronsUpDown,
  Info,
  ListFilter,
  Loader2,
  Monitor,
  PanelRightClose,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import * as Slider from "@radix-ui/react-slider";

import { cn, type ParsedItem } from "@/lib";
import type { I18nDict } from "../model/page-constants";
import type { ActivityItem, FontSizeScope, SortMode, ViewMode } from "../model/page-types";

type HomeRightSidebarProps = {
  t: I18nDict;
  rightSidebarWidth: number;
  items: ParsedItem[];
  processing: boolean;
  systemCommands: string[];
  bundleFilter: string;
  sortMode: SortMode;
  viewMode: ViewMode;
  visibleItems: ParsedItem[];
  selectedItems: ParsedItem[];
  skippedFiles: number;
  selectedItemIds: string[];
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
  uiScale?: number;
  compactMode?: boolean;
  fontSizeOffset?: number;
  fontSizeScope?: FontSizeScope;
  onCloseRight: () => void;
  onSetBundleFilter: (value: string) => void;
  onSetSortMode: (value: SortMode) => void;
  onSetViewMode: (value: ViewMode) => void;
  onSelectAllVisible: () => void;
  onBuildSelected: () => Promise<void>;
  onRemoveSelected: () => void;
  onApplyCommand: (value: string) => void;
  onAddSystemCommand: (value: string) => void;
  onRemoveSystemCommand: (index: number) => void;
  onUpdateSystemCommand: (index: number, text: string) => void;
  onQuickBuild: () => void;
  onCopyDraft: () => void;
  onToggleSelectItem: (id: string) => void;
  onScrollToItem: (itemId: string) => void;
  onToggleAutoSave: () => void;
  onToggleAnonymousMode: () => void;
  onSetIgnoredDirectories: (value: string) => void;
  onSetExcludedExtensions: (value: string) => void;
  onSetIncludePromptInResult: (value: boolean) => void;
  onSetShowSkippedFiles: (value: boolean) => void;
  onBytesToText: (value: number) => string;
  onSetUiScale?: (value: number) => void;
  onSetCompactMode?: (value: boolean) => void;
  onSetFontSizeOffset?: (value: number) => void;
  onSetFontSizeScope?: (value: FontSizeScope) => void;
  scrollOnSend?: boolean;
  sendKey?: "enter" | "shift+enter";
  onSetScrollOnSend?: (value: boolean) => void;
  onSetSendKey?: (value: "enter" | "shift+enter") => void;
  /** Когда компонент рендерится в мобильном drawer'е */
  drawerMode?: boolean;
};

export function HomeRightSidebar({
  t,
  rightSidebarWidth,
  items,
  processing,
  systemCommands,
  bundleFilter,
  sortMode,
  viewMode,
  visibleItems,
  selectedItems,
  skippedFiles,
  selectedItemIds,
  totalFiles,
  totalBytes,
  totalTokens,
  activity,
  autoSaveEnabled,
  anonymousMode,
  includePromptInResult,
  showSkippedFiles,
  settings,
  uiScale = 100,
  compactMode = false,
  fontSizeOffset = 0,
  fontSizeScope = "center",
  onCloseRight,
  onSetBundleFilter,
  onSetSortMode,
  onSetViewMode,
  onSelectAllVisible,
  onBuildSelected,
  onQuickBuild,
  onCopyDraft,
  onRemoveSelected,
  onApplyCommand,
  onAddSystemCommand,
  onRemoveSystemCommand,
  onUpdateSystemCommand,
  onToggleSelectItem,
  onScrollToItem,
  onToggleAutoSave,
  onToggleAnonymousMode,
  onSetIgnoredDirectories,
  onSetExcludedExtensions,
  onSetIncludePromptInResult,
  onSetShowSkippedFiles,
  onBytesToText,
  onSetUiScale,
  onSetCompactMode,
  onSetFontSizeOffset,
  onSetFontSizeScope,
  drawerMode = false,
}: HomeRightSidebarProps) {
  const [isAddingCommand, setIsAddingCommand] = React.useState(false);
  const [newCommandText, setNewCommandText] = React.useState("");
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editingText, setEditingText] = React.useState("");
  const [draftUiScale, setDraftUiScale] = React.useState(uiScale);
  const [draftCompactMode, setDraftCompactMode] = React.useState(compactMode);
  const [draftFontSizeOffset, setDraftFontSizeOffset] = React.useState(fontSizeOffset);
  const [draftFontSizeScope, setDraftFontSizeScope] = React.useState<FontSizeScope>(fontSizeScope);
  const [activityOpen, setActivityOpen] = React.useState(false);

  React.useEffect(() => {
    setDraftUiScale(uiScale);
    setDraftCompactMode(compactMode);
    setDraftFontSizeOffset(fontSizeOffset);
    setDraftFontSizeScope(fontSizeScope);
  }, [uiScale, compactMode, fontSizeOffset, fontSizeScope]);

  const sidebarTextStyle =
    fontSizeScope === "all"
      ? ({ fontSize: `calc(1rem + ${fontSizeOffset}px)` } as React.CSSProperties)
      : undefined;
  const asideStyle = drawerMode
    ? sidebarTextStyle
    : ({ width: `${rightSidebarWidth}px`, ...sidebarTextStyle } as React.CSSProperties);

  return (
    <aside
      className={cn(
        "border-l border-border/50 bg-background/90",
        drawerMode
          ? "flex h-full flex-col"
          : "hidden h-screen xl:sticky xl:top-0 xl:block"
      )}
      style={asideStyle}
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

      <div
        className={cn("space-y-3 overflow-auto p-3 pt-0", drawerMode ? "flex-1" : "h-[calc(100vh-6.75rem)]")}
        style={{ scrollbarGutter: "stable" } as React.CSSProperties}
      >
        <details className="group rounded-xl bg-muted/25 p-2.5" open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-semibold">
            {t.sysCommands}
            <div className="flex items-center gap-1">
              {!isAddingCommand && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setIsAddingCommand(true); }}
                  className="hidden group-open:inline-flex h-5 w-5 items-center justify-center rounded-md border border-border/60 bg-background/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title={t.addCommand}
                >
                  <Plus className="h-3 w-3" />
                </button>
              )}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
            </div>
          </summary>

          <div className="mt-2">
          {isAddingCommand && (
            <div className="mb-2">
              <textarea
                autoFocus
                value={newCommandText}
                onChange={(e) => setNewCommandText(e.target.value)}
                placeholder={t.cmdPlaceholder}
                rows={3}
                className="w-full resize-none rounded-md border border-border/70 bg-background p-2 text-[11px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <div className="mt-1.5 flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => { setIsAddingCommand(false); setNewCommandText(""); }}
                  className="rounded-md border border-border/60 bg-background/70 px-2.5 py-1 text-[10px] hover:bg-muted"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  disabled={!newCommandText.trim()}
                  onClick={() => {
                    if (!newCommandText.trim()) return;
                    onAddSystemCommand(newCommandText);
                    setNewCommandText("");
                    setIsAddingCommand(false);
                  }}
                  className="rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-[10px] text-primary hover:bg-primary/20 disabled:opacity-40"
                >
                  {t.save}
                </button>
              </div>
            </div>
          )}

          {systemCommands.length === 0 && !isAddingCommand && (
            <p className="mb-2 text-[10px] text-muted-foreground">{t.noCommands}</p>
          )}

          {systemCommands.length > 0 && (
            <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5">
              {systemCommands.map((cmd, index) => (
                <div key={index} className="group rounded-md border border-border/50 bg-background/70">
                  {editingIndex === index ? (
                    <div className="p-1.5">
                      <textarea
                        autoFocus
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded border border-border/70 bg-background p-1.5 text-[11px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary/40"
                      />
                      <div className="mt-1 flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="rounded-md border border-border/60 bg-background/70 px-2 py-0.5 text-[10px] hover:bg-muted"
                        >
                          {t.cancel}
                        </button>
                        <button
                          type="button"
                          disabled={!editingText.trim()}
                          onClick={() => {
                            if (!editingText.trim()) return;
                            onUpdateSystemCommand(index, editingText);
                            setEditingIndex(null);
                          }}
                          className="rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary hover:bg-primary/20 disabled:opacity-40"
                        >
                          {t.save}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-1 px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => onApplyCommand(cmd)}
                        className="min-w-0 flex-1 text-left text-[10px] leading-snug text-foreground/80 hover:text-foreground"
                      >
                        <span className="line-clamp-2 whitespace-pre-wrap">{cmd}</span>
                      </button>
                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => { setEditingIndex(index); setEditingText(cmd); }}
                          className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                          title={t.edit}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveSystemCommand(index)}
                          className="inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-destructive"
                          title={t.delete}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          </div>
        </details>

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

              <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="rounded-md border border-border/60 bg-background/70 px-1.5 py-0.5">{t.files}: {totalFiles}</span>
                <span className="rounded-md border border-border/60 bg-background/70 px-1.5 py-0.5">{t.size}: {onBytesToText(totalBytes)}</span>
                <span className="rounded-md border border-border/60 bg-background/70 px-1.5 py-0.5">{t.tokens}: {totalTokens}</span>
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
            <div
              className={cn("max-h-60 overflow-auto", viewMode === "cards" ? "space-y-1.5" : "space-y-1")}
              style={{ scrollbarGutter: "stable" } as React.CSSProperties}
            >
              {visibleItems.map((item) => {
                const isSelected = selectedItemIds.includes(item.id);

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
                        onClick={() => onScrollToItem(item.id)}
                        className="inline-flex h-5 w-5 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title={t.scrollToItem}
                      >
                        <ArrowRight className="h-3 w-3" />
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

        <details className="group rounded-xl bg-muted/25 p-2.5" open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-semibold">
            {t.privacy}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 space-y-px">
            <div className="flex items-center justify-between rounded-md px-1 py-1.5 transition-colors hover:bg-muted/60">
              <span className="select-none text-[10px] text-muted-foreground">{t.autosave}</span>
              <button
                type="button"
                role="switch"
                aria-checked={autoSaveEnabled}
                aria-label={t.autosave}
                onClick={onToggleAutoSave}
                className={cn(
                  "inline-flex h-4.5 w-8 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60",
                  autoSaveEnabled ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span className={cn(
                  "pointer-events-none block h-3.5 w-3.5 rounded-full bg-background shadow-sm ring-1 ring-black/5 transition-[transform] duration-200",
                  autoSaveEnabled ? "translate-x-3.5" : "translate-x-0"
                )} />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-md px-1 py-1.5 transition-colors hover:bg-muted/60">
              <span className="select-none text-[10px] text-muted-foreground">{t.anonymous}</span>
              <button
                type="button"
                role="switch"
                aria-checked={anonymousMode}
                aria-label={t.anonymous}
                onClick={onToggleAnonymousMode}
                className={cn(
                  "inline-flex h-4.5 w-8 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60",
                  anonymousMode ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span className={cn(
                  "pointer-events-none block h-3.5 w-3.5 rounded-full bg-background shadow-sm ring-1 ring-black/5 transition-[transform] duration-200",
                  anonymousMode ? "translate-x-3.5" : "translate-x-0"
                )} />
              </button>
            </div>

          </div>
        </details>

        <details className="group rounded-xl bg-muted/25 p-2.5" open>
          <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-semibold">
            {t.output}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2 space-y-px">
            <div className="flex items-center justify-between rounded-md px-1 py-1.5 transition-colors hover:bg-muted/60">
              <span className="select-none text-[10px] text-muted-foreground">{t.includePrompt}</span>
              <button
                type="button"
                role="switch"
                aria-checked={includePromptInResult}
                aria-label={t.includePrompt}
                onClick={() => onSetIncludePromptInResult(!includePromptInResult)}
                className={cn(
                  "inline-flex h-4.5 w-8 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60",
                  includePromptInResult ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span className={cn(
                  "pointer-events-none block h-3.5 w-3.5 rounded-full bg-background shadow-sm ring-1 ring-black/5 transition-[transform] duration-200",
                  includePromptInResult ? "translate-x-3.5" : "translate-x-0"
                )} />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-md px-1 py-1.5 transition-colors hover:bg-muted/60">
              <span className="select-none text-[10px] text-muted-foreground">{t.showSkipped}</span>
              <button
                type="button"
                role="switch"
                aria-checked={showSkippedFiles}
                aria-label={t.showSkipped}
                onClick={() => onSetShowSkippedFiles(!showSkippedFiles)}
                className={cn(
                  "inline-flex h-4.5 w-8 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/60",
                  showSkippedFiles ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span className={cn(
                  "pointer-events-none block h-3.5 w-3.5 rounded-full bg-background shadow-sm ring-1 ring-black/5 transition-[transform] duration-200",
                  showSkippedFiles ? "translate-x-3.5" : "translate-x-0"
                )} />
              </button>
            </div>
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

        <details className="group rounded-xl bg-muted/25 p-2.5">
          <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-semibold">
            {t.display}
            <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
          </summary>
          <div className="mt-2 space-y-2.5">
            {/* UI Scale */}
            <div>
              <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{t.uiScale}</span>
                <span className="font-semibold text-foreground">{draftUiScale}%</span>
              </div>
              {onSetUiScale && (
                <Slider.Root
                  className="relative flex h-5 w-full touch-none select-none items-center"
                  value={[draftUiScale]}
                  onValueChange={([v]) => { if (v !== undefined) setDraftUiScale(v); }}
                  min={75}
                  max={150}
                  step={5}
                >
                  <Slider.Track className="relative h-1.5 grow rounded-full bg-border">
                    <Slider.Range className="absolute h-full rounded-full bg-primary" />
                  </Slider.Track>
                  <Slider.Thumb className="block h-4 w-4 rounded-full border-2 border-primary bg-background shadow" />
                </Slider.Root>
              )}
              <div className="mt-1.5 flex gap-1">
                {[
                  { label: t.uiScaleCompact, value: 90 },
                  { label: t.uiScaleDefault, value: 100 },
                  { label: t.uiScaleLarge, value: 115 },
                ].map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDraftUiScale(value)}
                    className={cn(
                      "flex-1 rounded-md border px-1.5 py-1 text-[10px] transition-colors",
                      draftUiScale === value ? "border-primary/50 bg-primary/10" : "border-border/60 hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* Font size offset */}
            <div>
              <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{t.fontSizeLabel}</span>
                <span className="font-semibold text-foreground">{draftFontSizeOffset > 0 ? `+${draftFontSizeOffset}` : draftFontSizeOffset}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.max(-2, draftFontSizeOffset - 1);
                    setDraftFontSizeOffset(next);
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 text-sm hover:bg-muted"
                >−</button>
                <div className="flex-1 text-center text-[11px]">{draftFontSizeOffset === 0 ? "Base" : `${draftFontSizeOffset > 0 ? "+" : ""}${draftFontSizeOffset}`}</div>
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(4, draftFontSizeOffset + 1);
                    setDraftFontSizeOffset(next);
                  }}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/60 text-sm hover:bg-muted"
                >+</button>
              </div>
              <div className="mt-1.5">
                <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{t.fontSizeTargetLabel}</span>
                  <span className="font-semibold text-foreground">{draftFontSizeScope === "all" ? t.fontSizeTargetAll : t.fontSizeTargetCenter}</span>
                </div>
                <div className="flex gap-1">
                  {[{ label: t.fontSizeTargetCenter, value: "center" as const }, { label: t.fontSizeTargetAll, value: "all" as const }].map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDraftFontSizeScope(value)}
                      className={cn(
                        "flex-1 rounded-md border px-1.5 py-1 text-[10px] transition-colors",
                        draftFontSizeScope === value ? "border-primary/50 bg-primary/10" : "border-border/60 hover:bg-muted"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {/* Compact mode */}
            <button
              type="button"
              onClick={() => setDraftCompactMode(!draftCompactMode)}
              className={cn(
                "flex w-full items-center justify-between rounded-md border px-2 py-1.5 text-left text-[10px] transition-colors",
                draftCompactMode ? "border-primary/50 bg-primary/10" : "border-border/70 hover:bg-muted"
              )}
              aria-pressed={draftCompactMode}
            >
              <span className="inline-flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", draftCompactMode ? "bg-primary" : "bg-muted-foreground/60")} />
                {t.compactModeLabel}
              </span>
              <span className={cn("rounded-full border px-1.5 py-0.5 text-[9px] font-semibold leading-none", draftCompactMode ? "border-primary/40 bg-primary/15 text-primary" : "border-border/70 text-muted-foreground")}>
                {draftCompactMode ? "ON" : "OFF"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSetUiScale?.(draftUiScale);
                onSetFontSizeOffset?.(draftFontSizeOffset);
                onSetFontSizeScope?.(draftFontSizeScope);
                onSetCompactMode?.(draftCompactMode);
                window.location.reload();
              }}
              className="inline-flex h-7 w-full items-center justify-center rounded-md border border-primary/50 bg-primary/10 px-2 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              {t.applyAndRefresh}
            </button>
          </div>
        </details>

        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setActivityOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm font-semibold transition-colors hover:bg-muted"
          >
            {t.activity}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                activityOpen && "rotate-180"
              )}
            />
          </button>
        </div>
        <details
          className="group rounded-xl bg-muted/25 p-2.5 text-[10px]"
          open={activityOpen}
          onToggle={(e) => setActivityOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
            {t.activity}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-2">
            <div className="mb-1.5 flex items-center justify-end">
              <a href="https://github.com/wwewtech/txt.wwew.tech" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                {t.source} <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="overflow-hidden rounded-md border border-border/60 bg-background/80">
              <div className="grid grid-cols-[3fr_1fr_1.25fr_2fr] gap-2 border-b border-border/60 bg-muted/30 px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                <div>{t.activityMessage}</div>
                <div className="text-center">{t.activityStatus}</div>
                <div className="text-center">{t.activityTime}</div>
                <div className="text-center">{t.activityError}</div>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {activity.length === 0 ? (
                  <div className="px-2 py-2 text-[10px] text-muted-foreground">{t.noActions}</div>
                ) : (
                  activity.map((item) => {
                    const time = new Date(item.at).toLocaleString(undefined, {
                      year: "2-digit",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const status = item.status ?? "success";

                    const statusIcon =
                      status === "success" ? (
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      ) : status === "error" ? (
                        <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      ) : status === "warning" ? (
                        <Info className="h-3.5 w-3.5 text-amber-500" />
                      ) : status === "pending" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500" />
                      ) : (
                        <Info className="h-3.5 w-3.5 text-sky-500" />
                      );

                    const statusLabel =
                      status === "success"
                        ? t.activityStatusSuccess
                        : status === "error"
                        ? t.activityStatusError
                        : status === "warning"
                        ? t.activityStatusWarning
                        : status === "pending"
                        ? t.activityStatusPending
                        : t.activityStatusInfo;

                    return (
                      <div key={item.id} className="grid grid-cols-[3fr_1fr_1.25fr_2fr] gap-2 px-2 py-2 text-[10px] odd:bg-muted/10">
                        <div className="wrap-break-word">{item.label}</div>
                        <div className="flex items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground">
                          {statusIcon}
                          <span className="capitalize">{statusLabel}</span>
                        </div>
                        <div className="text-center text-muted-foreground">{time}</div>
                        <div className="text-right text-muted-foreground">{item.error ?? "—"}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </details>
      </div>
    </aside>
  );
}
