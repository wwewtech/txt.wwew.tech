"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";

import {
  Files,
  Github,
  Languages,
  Monitor,
  Moon,
  Plus,
  Link as LinkIcon,
  Link2,
  MoreHorizontal,
  PanelLeftClose,
  Pencil,
  Share2,
  Sun,
  Trash2,
  User,
  Copy,
} from "lucide-react";

import { DragSegmented } from "@/components";
import { cn } from "@/lib";
import type { I18nDict } from "../model/page-constants";
import type { FontSizeScope, HistoryItem, Language } from "../model/page-types";

type HomeLeftSidebarProps = {
  t: I18nDict;
  language: Language;
  onLanguageChange: (next: Language) => void;
  history: HistoryItem[];
  currentChatId: string | null;
  openHistoryMenuId: string | null;
  onCollapseLeft: () => void;
  onStartNewChat: () => void;
  onSelectHistory: (entry: HistoryItem) => void;
  onToggleHistoryMenu: (id: string) => void;
  onDuplicateHistoryItem: (id: string) => void;
  onShareHistoryItem: (id: string) => Promise<void>;
  onRenameHistoryItem: (id: string) => void;
  onCopyHistoryPrompt: (id: string) => Promise<void>;
  onCopyHistoryFinal: (id: string) => Promise<void>;
  onDeleteHistoryItem: (id: string) => void;
  fontSizeOffset?: number;
  fontSizeScope?: FontSizeScope;
  /** Когда компонент рендерится в мобильном drawer'е */
  drawerMode?: boolean;
};

export function HomeLeftSidebar({
  t,
  language,
  onLanguageChange,
  history,
  currentChatId,
  openHistoryMenuId,
  onCollapseLeft,
  onStartNewChat,
  onSelectHistory,
  onToggleHistoryMenu,
  onDuplicateHistoryItem,
  onShareHistoryItem,
  onRenameHistoryItem,
  onCopyHistoryPrompt,
  onCopyHistoryFinal,
  onDeleteHistoryItem,
  fontSizeOffset = 0,
  fontSizeScope = "center",
  drawerMode = false,
}: HomeLeftSidebarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const themeValue = (mounted ? theme : "system") ?? "system";
  const resolvedThemeValue =
    themeValue === "light" || themeValue === "dark" || themeValue === "system"
      ? themeValue
      : "system";

  const themeOptions = React.useMemo(
    () => [
      { value: "light", label: "Light", content: <Sun className="h-3.5 w-3.5" /> },
      { value: "dark", label: "Dark", content: <Moon className="h-3.5 w-3.5" /> },
      { value: "system", label: "System", content: <Monitor className="h-3.5 w-3.5" /> },
    ] as const,
    []
  );

  const languageOptions = React.useMemo(
    () => [
      {
        value: "ru",
        label: "Русский",
        content: (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
            <Languages className="h-3 w-3" /> RU
          </span>
        ),
      },
      {
        value: "en",
        label: "English",
        content: (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold">
            <Languages className="h-3 w-3" /> EN
          </span>
        ),
      },
    ] as const,
    []
  );

  const sidebarTextStyle =
    fontSizeScope === "all"
      ? ({ fontSize: `calc(1rem + ${fontSizeOffset}px)` } as React.CSSProperties)
      : undefined;

  const footerLabelClass = "text-xs text-muted-foreground";
  const footerMetaLinkClass =
    "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground";

  return (
    <aside
      className={cn(
        "ds-sidebar border-r border-border/60 bg-background/95 px-3 py-3",
        drawerMode
          ? "flex h-full flex-col"
          : "hidden h-screen xl:sticky xl:top-0 xl:flex xl:flex-col"
      )}
      style={sidebarTextStyle}
    >
      <div className="mb-3 -mx-3 border-b border-border/50 pb-3">
        <div className="px-3">
          <div className="flex items-center justify-between gap-2 px-1.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">txt.wwew.tech</p>
              <p className="truncate text-xs text-muted-foreground">{t.localCockpit}</p>
            </div>
            <button
              type="button"
              onClick={onCollapseLeft}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onStartNewChat}
        className="ds-surface-subtle mb-3 inline-flex h-10 w-full items-center gap-2 rounded-lg bg-muted/35 px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/55"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>{t.newChat}</span>
      </button>

      <div className="min-h-0 w-full flex-1 overflow-auto">
        <p className="mb-2 px-2 text-[11px] uppercase tracking-wide text-muted-foreground">{t.history}</p>
        <div className="space-y-1">
          {history.length === 0 && (
            <p className="rounded-lg px-2 py-2 text-xs text-muted-foreground">{t.noEntries}</p>
          )}
          {history.map((entry) => (
            <div
              key={entry.id}
              data-history-item
              className={cn(
                "group relative rounded-lg px-2 py-2 transition-colors hover:bg-muted/40",
                currentChatId === entry.id && "bg-muted/65"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectHistory(entry)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-[13px] font-medium text-foreground">{entry.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {entry.tokenEstimate} {t.tokenSuffix} · {new Date(entry.updatedAt).toLocaleTimeString()}
                  </p>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleHistoryMenu(entry.id);
                    }}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-background group-hover:opacity-100"
                    title={t.actions}
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {openHistoryMenuId === entry.id && (
                <div className="ds-surface-floating absolute right-1 top-9 z-20 w-44 rounded-md border border-border/70 bg-background p-1 shadow-xl">
                  <button
                    type="button"
                    onClick={() => onDuplicateHistoryItem(entry.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    <Files className="h-3.5 w-3.5" />
                    {t.makeCopy}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onShareHistoryItem(entry.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {t.share}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRenameHistoryItem(entry.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t.rename}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onCopyHistoryPrompt(entry.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    {t.copyPrompt}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onCopyHistoryFinal(entry.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t.copyFinal}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteHistoryItem(entry.id)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-red-500 hover:bg-muted"
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

      <div className="mt-3 -mx-3 border-t border-border/50 pt-3">
        <div className="px-3">
          <div className="space-y-2">
            <div className="ds-surface-subtle rounded-lg bg-muted/20 px-2.5 py-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className={footerLabelClass}>{t.theme}</span>
                <DragSegmented
                  value={resolvedThemeValue}
                  onValueChange={(next) => setTheme(next)}
                  options={themeOptions}
                  className="rounded-md border-0 bg-background/60 p-0.5"
                  trackClassName="gap-0"
                  buttonClassName="h-6 w-7 rounded-sm px-0 text-muted-foreground transition-colors hover:text-foreground"
                  activeButtonClassName="text-white"
                  indicatorClassName="bg-neutral-900"
                />
              </div>

              <div className="mt-2 -mx-2.5 border-t border-border/30 pt-2">
                <div className="px-2.5 flex items-center justify-between gap-3">
                  <span className={footerLabelClass}>{t.language}</span>
                  <DragSegmented
                    value={language}
                    onValueChange={onLanguageChange}
                    options={languageOptions}
                    className="rounded-md border-0 bg-background/60 p-0.5"
                    trackClassName="gap-0"
                    buttonClassName="h-6 rounded-sm px-2 text-muted-foreground transition-colors hover:text-foreground"
                    activeButtonClassName="text-white"
                    indicatorClassName="bg-neutral-900"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1">
              <a
                href="https://wwew.tech"
                target="_blank"
                rel="noreferrer"
                className={footerMetaLinkClass}
                title="wwew.tech"
              >
                <User className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://openspacedev.ru"
                target="_blank"
                rel="noreferrer"
                className={footerMetaLinkClass}
                title="openspacedev.ru"
              >
                <LinkIcon className="h-3.5 w-3.5" />
              </a>
              <a
                href="https://github.com/wwewtech/txt.wwew.tech"
                target="_blank"
                rel="noreferrer"
                className={footerMetaLinkClass}
                title="GitHub"
              >
                <Github className="h-3.5 w-3.5" />
              </a>
            </div>
            <Link href="/terms" className="rounded-md px-2 py-1 transition-colors hover:text-foreground">
              {t.terms}
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
