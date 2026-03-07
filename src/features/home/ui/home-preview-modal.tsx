"use client";

import * as React from "react";
import { Copy, FileText, Trash2, X } from "lucide-react";

import type { ParsedItem } from "@/lib";
import type { I18nDict } from "../model/page-constants";

type HomePreviewModalProps = {
  activePreview: ParsedItem;
  t: I18nDict;
  renderMessageBody: (content: string) => React.ReactNode;
  onCopy: (value: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export function HomePreviewModal({
  activePreview,
  t,
  renderMessageBody,
  onCopy,
  onDelete,
  onClose,
}: HomePreviewModalProps) {
  return (
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
              onClick={() => onDelete(activePreview.id)}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-muted"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t.delete}
            </button>
            <button
              type="button"
              onClick={onClose}
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
  );
}
