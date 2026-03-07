"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib";

export function CollapsibleMarkdownPre({ children }: { children: React.ReactNode }) {
  const first = React.Children.toArray(children)[0] as
    | React.ReactElement<{ className?: string; children?: React.ReactNode }>
    | undefined;
  const className = first?.props?.className ?? "";
  const lang = /language-([a-zA-Z0-9_-]+)/.exec(className)?.[1] ?? "code";

  const textContent = React.useMemo(() => {
    const raw = first?.props?.children;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw)) {
      return raw
        .map((part) => (typeof part === "string" ? part : ""))
        .join("");
    }
    return "";
  }, [first]);

  const lineCount = React.useMemo(() => {
    if (!textContent) return 0;
    return textContent.split(/\r?\n/).length;
  }, [textContent]);

  const [collapsed, setCollapsed] = React.useState(lineCount > 8);
  const previousTextContentRef = React.useRef(textContent);

  React.useEffect(() => {
    if (previousTextContentRef.current === textContent) return;
    previousTextContentRef.current = textContent;
    setCollapsed(lineCount > 8);
  }, [lineCount, textContent]);

  const isRu = typeof document !== "undefined" && document.documentElement.lang.toLowerCase().startsWith("ru");
  const preT = isRu
    ? {
        toggle: "Переключить блок кода",
        expand: "Развернуть",
        collapse: "Свернуть",
        hidden: "Код скрыт",
        lines: "строк",
      }
    : {
        toggle: "Toggle code block",
        expand: "Expand",
        collapse: "Collapse",
        hidden: "Code hidden",
        lines: "lines",
      };

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/40">
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <span>{lang}</span>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="inline-flex items-center gap-1 rounded px-1 py-0.5 normal-case hover:bg-background/70"
          aria-label={preT.toggle}
        >
          <span>{collapsed ? preT.expand : preT.collapse}</span>
          <ChevronDown className={cn("h-3 w-3 transition-transform", collapsed && "-rotate-90")} />
        </button>
      </div>
      {collapsed ? (
        <div className="px-3 py-2 text-[11px] text-muted-foreground">{preT.hidden} • {lineCount} {preT.lines}</div>
      ) : (
        <pre className="overflow-x-auto p-3 text-xs leading-5">{children}</pre>
      )}
    </div>
  );
}

export const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => <p className="text-lg font-semibold">{children}</p>,
  h2: ({ children }: { children?: React.ReactNode }) => <p className="text-base font-semibold">{children}</p>,
  h3: ({ children }: { children?: React.ReactNode }) => <p className="text-sm font-semibold">{children}</p>,
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="whitespace-pre-wrap text-sm leading-6 wrap-anywhere">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc space-y-1 pl-5 text-sm">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal space-y-1 pl-5 text-sm">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto rounded-xl border border-border/60 bg-background">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border-b border-border/60 bg-muted/40 px-2 py-1.5 text-left font-medium">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => <td className="border-b border-border/40 px-2 py-1.5 align-top">{children}</td>,
  pre: ({ children }: { children?: React.ReactNode }) => {
    return <CollapsibleMarkdownPre>{children}</CollapsibleMarkdownPre>;
  },
  code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode; inline?: boolean }) => {
    const isInline = props.inline;
    const isBlock = Boolean(className?.includes("language-")) || isInline === false;
    if (isBlock) return <code className={className}>{children}</code>;
    return <code className="rounded border border-border/60 bg-muted/40 px-1 py-0.5 text-xs">{children}</code>;
  },
};
