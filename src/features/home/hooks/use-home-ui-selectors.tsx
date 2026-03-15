"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { createId, estimateTokens, type ParsedItem } from "@/lib";
import { i18n } from "../model/page-constants";
import { buildContextGroups, buildTimelineEntries } from "../model/home-logic";
import type { ActivityItem, ActivityStatus, ChatMessage, Language, SortMode } from "../model/page-types";
import { markdownComponents } from "../ui/markdown-components";
import { useUIStore } from "../store/use-ui-store";

type ActivitySetter = (value: ActivityItem[] | ((prev: ActivityItem[]) => ActivityItem[])) => void;

interface UseHomeUiSelectorsInput {
  language: Language;
  markdownEnabled: boolean;
  items: ParsedItem[];
  prompt: string;
  chatMessages: ChatMessage[];
  bundleFilter: string;
  sortMode: SortMode;
  showSkippedFiles: boolean;
  selectedItemIds: string[];
  setActivity: ActivitySetter;
}

export function useHomeUiSelectors({
  language,
  markdownEnabled,
  items,
  prompt,
  chatMessages,
  bundleFilter,
  sortMode,
  showSkippedFiles,
  selectedItemIds,
  setActivity,
}: UseHomeUiSelectorsInput) {
  const t = i18n[language];

  const l = React.useCallback(
    (ruText: string, enText: string) => (language === "ru" ? ruText : enText),
    [language]
  );

  const estimateIfNotEmpty = React.useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return estimateTokens(trimmed);
  }, []);

  const contextTokens = React.useMemo(
    () => items.reduce((sum, item) => sum + item.tokenEstimate, 0),
    [items]
  );

  const draftPromptTokens = React.useMemo(
    () => estimateIfNotEmpty(prompt),
    [estimateIfNotEmpty, prompt]
  );

  const userChatTokens = React.useMemo(() => {
    const text = chatMessages
      .filter((message) => message.role === "user")
      .map((message) => message.content)
      .join("\n\n");

    return estimateIfNotEmpty(text);
  }, [chatMessages, estimateIfNotEmpty]);

  const totalTokens = contextTokens + userChatTokens + draftPromptTokens;

  const contextGroups = React.useMemo(() => buildContextGroups(items), [items]);

  const timelineEntries = React.useMemo(
    () => buildTimelineEntries(chatMessages, contextGroups),
    [chatMessages, contextGroups]
  );

  const systemCommands = useUIStore((state) => state.systemCommands);
  const fontSizeOffset = useUIStore((state) => state.fontSizeOffset);

  const visibleItems = React.useMemo(() => {
    const filter = bundleFilter.trim().toLowerCase();
    const base = items.filter((item) => {
      if (!showSkippedFiles && item.error === "Skipped by filters") return false;
      if (!filter) return true;
      return `${item.name} ${item.path}`.toLowerCase().includes(filter);
    });

    const sorted = [...base];
    sorted.sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      if (sortMode === "tokens") return b.tokenEstimate - a.tokenEstimate;
      if (sortMode === "size") return b.size - a.size;
      return 0;
    });
    return sorted;
  }, [items, bundleFilter, sortMode, showSkippedFiles]);

  const selectedItems = React.useMemo(
    () => visibleItems.filter((item) => selectedItemIds.includes(item.id)),
    [visibleItems, selectedItemIds]
  );

  const skippedFiles = React.useMemo(
    () => items.filter((item) => item.error === "Skipped by filters").length,
    [items]
  );

  const totalBytes = React.useMemo(
    () => items.reduce((sum, item) => sum + item.size, 0),
    [items]
  );

  const totalFiles = React.useMemo(() => {
    return items.reduce((sum, item) => {
      if (item.kind === "archive") return sum + (item.children?.length ?? 0);
      return sum + 1;
    }, 0);
  }, [items]);

  const bytesToText = React.useCallback((value: number) => {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  type PushActivityInput =
    | string
    | { label: string; status?: ActivityStatus; error?: string };

  const pushActivity = React.useCallback((input: PushActivityInput) => {
    const { label, status = "success", error } =
      typeof input === "string" ? { label: input, status: "success", error: undefined } : input;

    setActivity((prev) =>
      [{ id: createId(), label, at: new Date().toISOString(), status, error }, ...prev].slice(0, 12)
    );
  }, [setActivity]);

  const renderMessageBody = React.useCallback(
    (content: string) => {
      const hasMarkdownSyntax = /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s)|```|`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^\)]+\)|\|.+\||\$[^$]+\$/.test(
        content
      );

      if (!markdownEnabled) {
        return (
          <pre
            className="whitespace-pre-wrap wrap-anywhere font-mono text-xs leading-5"
            style={{ fontSize: `calc(0.75rem + ${fontSizeOffset}px)` }}
          >
            {content}
          </pre>
        );
      }

      if (!hasMarkdownSyntax) {
        return (
          <pre
            className="whitespace-pre-wrap wrap-anywhere text-sm leading-6 font-sans"
            style={{ fontSize: `calc(0.875rem + ${fontSizeOffset}px)` }}
          >
            {content}
          </pre>
        );
      }

      return (
        <div style={{ fontSize: `calc(0.875rem + ${fontSizeOffset}px)` }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    },
    [fontSizeOffset, markdownEnabled]
  );

  return {
    t,
    l,
    totalTokens,
    contextGroups,
    timelineEntries,
    systemCommands,
    visibleItems,
    selectedItems,
    skippedFiles,
    totalBytes,
    totalFiles,
    bytesToText,
    pushActivity,
    renderMessageBody,
  };
}
