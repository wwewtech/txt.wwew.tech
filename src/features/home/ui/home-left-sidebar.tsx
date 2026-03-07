"use client";

import {
  Files,
  Github,
  Languages,
  Link as LinkIcon,
  Link2,
  MessageSquarePlus,
  MoreHorizontal,
  PanelLeftClose,
  Pencil,
  Share2,
  Trash2,
  User,
  Copy,
} from "lucide-react";

import { DragSegmented, ThemeToggle } from "@/components";
import { cn } from "@/lib";
import type { I18nDict } from "../model/page-constants";
import type { HistoryItem, Language } from "../model/page-types";

type HomeLeftSidebarProps = {
  t: I18nDict;
  language: Language;
  onLanguageChange: (next: Language) => void;
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
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
};

export function HomeLeftSidebar({
  t,
  language,
  onLanguageChange,
  autoSaveEnabled,
  onToggleAutoSave,
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
}: HomeLeftSidebarProps) {
  return (
    <aside className="hidden h-screen border-r border-border/70 bg-muted/15 px-3 py-3 xl:sticky xl:top-0 xl:flex xl:flex-col">
      <div className="mb-3 w-full rounded-2xl border border-border/70 bg-background/80 p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold tracking-tight">txt.wwew.tech</p>
            <p className="text-xs text-muted-foreground">{t.localCockpit}</p>
          </div>
          <button
            type="button"
            onClick={onCollapseLeft}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onStartNewChat}
        className="mb-3 inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2 text-sm hover:bg-muted"
      >
        <MessageSquarePlus className="h-4 w-4" />
        <span>{t.newChat}</span>
      </button>

      <div className="mb-3 rounded-2xl border border-border/70 bg-background/80 p-2">
        <button
          type="button"
          onClick={onToggleAutoSave}
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
                  onClick={() => onSelectHistory(entry)}
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
                      onToggleHistoryMenu(entry.id);
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
                    onClick={() => onDuplicateHistoryItem(entry.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    <Files className="h-3.5 w-3.5" />
                    {t.makeCopy}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onShareHistoryItem(entry.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    {t.share}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRenameHistoryItem(entry.id)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t.rename}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onCopyHistoryPrompt(entry.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    {t.copyPrompt}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await onCopyHistoryFinal(entry.id);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-muted"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {t.copyFinal}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteHistoryItem(entry.id)}
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
          onValueChange={onLanguageChange}
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
  );
}
