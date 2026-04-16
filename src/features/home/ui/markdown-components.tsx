"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib";

const contentFont = {
  body: { fontSize: "calc(0.875rem + var(--font-size-offset, 0) * 1px)" },
  h1: { fontSize: "calc(1.125rem + var(--font-size-offset, 0) * 1px)" },
  h2: { fontSize: "calc(1rem + var(--font-size-offset, 0) * 1px)" },
  h3: { fontSize: "calc(0.875rem + var(--font-size-offset, 0) * 1px)" },
  table: { fontSize: "calc(0.75rem + var(--font-size-offset, 0) * 1px)" },
  inlineCode: { fontSize: "calc(11px + var(--font-size-offset, 0) * 1px)" },
  code: { fontSize: "calc(13px + var(--font-size-offset, 0) * 1px)" },
  codeUi: { fontSize: "calc(11px + var(--font-size-offset, 0) * 1px)" },
} as const;

// ── Shiki singleton (lazy, loads all bundled languages once) ─────────────────
type ShikiHighlighter = Awaited<ReturnType<typeof import("shiki")["createHighlighter"]>>;

let _highlighterPromise: Promise<ShikiHighlighter> | null = null;

function getHighlighter(): Promise<ShikiHighlighter> {
  if (!_highlighterPromise) {
    _highlighterPromise = (async () => {
      const { createHighlighter, bundledLanguages } = await import("shiki");
      return createHighlighter({
        themes: ["github-light", "github-dark"],
        langs: Object.values(bundledLanguages),
      });
    })();
  }
  return _highlighterPromise;
}
// ────────────────────────────────────────────────────────────────────────────

function HighlightedCode({ code, lang }: { code: string; lang: string }) {
  const { resolvedTheme } = useTheme();
  const [html, setHtml] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const shikiTheme = resolvedTheme === "dark" ? "github-dark" : "github-light";
    getHighlighter().then((hl) => {
      if (cancelled) return;
      const loaded = hl.getLoadedLanguages() as string[];
      const actualLang = loaded.includes(lang) ? lang : "text";
      const highlighted = hl.codeToHtml(code, { lang: actualLang, theme: shikiTheme });
      if (!cancelled) setHtml(highlighted);
    });
    return () => { cancelled = true; };
  }, [code, lang, resolvedTheme]);

  if (!html) {
    return (
      <pre className="ds-surface-subtle overflow-x-auto bg-muted/40 p-4 font-mono text-[13px] leading-relaxed" style={contentFont.code}>
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      className="[&>pre]:overflow-x-auto [&>pre]:p-4 [&>pre]:font-mono [&>pre]:text-(length:--content-code-size) [&>pre]:leading-relaxed [&>pre]:rounded-none! [&>pre]:bg-transparent!"
      style={{ ["--content-code-size" as const]: "calc(13px + var(--font-size-offset, 0) * 1px)" } as React.CSSProperties}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function CollapsibleMarkdownPre({ children }: { children: React.ReactNode }) {
  const first = React.Children.toArray(children)[0] as
    | React.ReactElement<{ className?: string; children?: React.ReactNode }>
    | undefined;
  const className = first?.props?.className ?? "";
  const lang = /language-([a-zA-Z0-9_-]+)/.exec(className)?.[1] ?? "text";

  const textContent = React.useMemo(() => {
    const raw = first?.props?.children;
    if (typeof raw === "string") return raw.replace(/\n$/, "");
    if (Array.isArray(raw)) {
      return raw
        .map((part) => (typeof part === "string" ? part : ""))
        .join("")
        .replace(/\n$/, "");
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
    <div className="ds-surface-subtle overflow-hidden rounded-xl border border-border/60">
      <div className="ds-table-head flex items-center justify-between border-b border-border/50 bg-muted/60 px-3 py-2">
        <span className="font-mono text-[11px] font-medium text-muted-foreground">{lang}</span>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="ds-control inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          style={contentFont.codeUi}
          aria-label={preT.toggle}
        >
          <span>{collapsed ? preT.expand : preT.collapse}</span>
          <ChevronDown className={cn("h-3 w-3 transition-transform", collapsed && "-rotate-90")} />
        </button>
      </div>
      {collapsed ? (
        <div className="ds-surface-subtle bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground" style={contentFont.codeUi}>{preT.hidden} • {lineCount} {preT.lines}</div>
      ) : (
        <HighlightedCode code={textContent} lang={lang} />
      )}
    </div>
  );
}

export const markdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => <p className="text-lg font-semibold" style={contentFont.h1}>{children}</p>,
  h2: ({ children }: { children?: React.ReactNode }) => <p className="text-base font-semibold" style={contentFont.h2}>{children}</p>,
  h3: ({ children }: { children?: React.ReactNode }) => <p className="text-sm font-semibold" style={contentFont.h3}>{children}</p>,
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="whitespace-pre-wrap text-sm leading-6 wrap-anywhere" style={contentFont.body}>{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc space-y-1 pl-5 text-sm" style={contentFont.body}>{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal space-y-1 pl-5 text-sm" style={contentFont.body}>{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li>{children}</li>,
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="ds-table-shell overflow-x-auto rounded-xl border border-border/60 bg-background">
      <table className="w-full border-collapse text-xs" style={contentFont.table}>{children}</table>
    </div>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="ds-table-head border-b border-border/60 bg-muted/40 px-2 py-1.5 text-left font-medium">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => <td className="border-b border-border/40 px-2 py-1.5 align-top">{children}</td>,
  pre: ({ children }: { children?: React.ReactNode }) => {
    return <CollapsibleMarkdownPre>{children}</CollapsibleMarkdownPre>;
  },
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    // Block code is handled entirely by CollapsibleMarkdownPre via Shiki.
    // This component is only ever visible for inline code (inside paragraphs).
    if (className?.includes("language-")) return <code className={className}>{children}</code>;
    return <code className="ds-chip rounded border border-border/60 bg-muted/40 px-1 py-0.5 font-mono text-[11px]" style={contentFont.inlineCode}>{children}</code>;
  },
};
