"use client";

import { X } from "lucide-react";

import type { I18nDict } from "../model/page-constants";
import type { EditDialogState } from "../model/page-types";

type HomeEditDialogProps = {
  editDialog: EditDialogState;
  t: I18nDict;
  onClose: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function HomeEditDialog({ editDialog, t, onClose, onChange, onSubmit }: HomeEditDialogProps) {
  return (
    <div
      className="ds-overlay fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="ds-surface-panel w-full max-w-2xl rounded-2xl border border-border bg-background"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <p className="text-sm font-semibold">
            {editDialog.mode === "history-rename" ? t.renameChatTitle : t.editContextTitle}
          </p>
          <button
            type="button"
            onClick={onClose}
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
              onChange={(event) => onChange(event.target.value)}
              placeholder={t.renamePlaceholder}
              autoFocus
              className="h-10 w-full rounded-xl border border-border/70 bg-background px-3 text-sm outline-none focus:border-primary/40"
            />
          ) : (
            <textarea
              value={editDialog.value}
              onChange={(event) => onChange(event.target.value)}
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
            onClick={onClose}
            className="inline-flex h-8 items-center rounded-lg border border-border/70 px-3 text-xs hover:bg-muted"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!editDialog.value.trim()}
            className="inline-flex h-8 items-center rounded-lg border border-border/70 px-3 text-xs hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
