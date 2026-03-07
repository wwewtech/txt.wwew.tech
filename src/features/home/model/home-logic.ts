import type { ParsedItem } from "@/lib";

import type { ChatMessage, ContextGroup, HistoryItem, TimelineEntry } from "./page-types";

function toTimestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function deriveFirstContextTitle(items: ParsedItem[]) {
  const firstItem = items[0];
  if (!firstItem) return "";

  if (firstItem.kind === "archive") {
    return firstItem.name.trim();
  }

  const normalizedPath = firstItem.path.replaceAll("\\", "/");
  const segments = normalizedPath.split("/").filter(Boolean);
  if (segments.length > 1) {
    return segments[0] ?? firstItem.name;
  }

  return firstItem.name || segments.at(-1) || normalizedPath;
}

export function buildNextUntitledTitle(history: HistoryItem[]) {
  const untitledNumbers = history
    .map((entry) => /^Untitled\s+(\d+)$/i.exec(entry.title)?.[1])
    .filter(Boolean)
    .map((value) => Number(value));
  const maxUntitled = untitledNumbers.length ? Math.max(...untitledNumbers) : 0;
  return `Untitled ${maxUntitled + 1}`;
}

export function deriveHistoryTitle(params: {
  existingTitle?: string | null;
  prompt: string;
  chatMessages: ChatMessage[];
  items: ParsedItem[];
  nextUntitledTitle: string;
}) {
  const { existingTitle, prompt, chatMessages, items, nextUntitledTitle } = params;

  if (existingTitle) return existingTitle;

  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt) return trimmedPrompt.slice(0, 70);

  const firstUserMessage = chatMessages.find((message) => message.role === "user")?.content.trim();
  if (firstUserMessage) return firstUserMessage.slice(0, 70);

  const firstContextTitle = deriveFirstContextTitle(items);
  if (firstContextTitle) return firstContextTitle.slice(0, 70);

  return nextUntitledTitle;
}

export function buildContextGroups(items: ParsedItem[]): ContextGroup[] {
  const map = new Map<string, ContextGroup>();
  const order: string[] = [];

  const addToGroup = (
    key: string,
    seed: Omit<ContextGroup, "items" | "tokenEstimate" | "size" | "fileCount" | "folderCount">,
    item: ParsedItem
  ) => {
    if (!map.has(key)) {
      map.set(key, {
        ...seed,
        tokenEstimate: 0,
        size: 0,
        fileCount: 0,
        folderCount: 0,
        items: [],
      });
      order.push(key);
    }

    const current = map.get(key);
    if (!current) return;
    current.items.push(item);
    current.tokenEstimate += item.tokenEstimate;
    current.size += item.size;
    current.fileCount += item.kind === "archive" ? item.children?.length ?? 0 : 1;
    const itemAddedAt = item.addedAt ?? item.children?.[0]?.addedAt ?? new Date(0).toISOString();
    if (toTimestamp(itemAddedAt) >= toTimestamp(current.createdAt)) {
      current.createdAt = itemAddedAt;
    }
  };

  items.forEach((item) => {
    if (item.kind === "archive") {
      const folderSet = new Set<string>();
      item.children?.forEach((child) => {
        const normalized = child.path.replaceAll("\\", "/").split("/");
        for (let index = 1; index < normalized.length - 1; index += 1) {
          folderSet.add(normalized.slice(0, index + 1).join("/"));
        }
      });
      map.set(`archive:${item.id}`, {
        id: `archive:${item.id}`,
        label: item.name,
        path: item.path,
        kind: "archive",
        createdAt: item.addedAt ?? item.children?.[0]?.addedAt ?? new Date(0).toISOString(),
        fileCount: item.children?.length ?? 0,
        folderCount: folderSet.size,
        tokenEstimate: item.tokenEstimate,
        size: item.size,
        items: [item],
      });
      order.push(`archive:${item.id}`);
      return;
    }

    const normalizedPath = item.path.replaceAll("\\", "/");
    const segments = normalizedPath.split("/").filter(Boolean);
    if (segments.length > 1) {
      addToGroup(
        `folder:${segments[0]}`,
        {
          id: `folder:${segments[0]}`,
          label: segments[0],
          path: segments[0],
          kind: "folder",
          createdAt: item.addedAt ?? new Date(0).toISOString(),
        },
        item
      );
      return;
    }

    map.set(`file:${item.id}`, {
      id: `file:${item.id}`,
      label: item.name,
      path: item.path,
      kind: "file",
      createdAt: item.addedAt ?? new Date(0).toISOString(),
      fileCount: 1,
      folderCount: 0,
      tokenEstimate: item.tokenEstimate,
      size: item.size,
      items: [item],
    });
    order.push(`file:${item.id}`);
  });

  order.forEach((key) => {
    const entry = map.get(key);
    if (!entry || entry.kind !== "folder") return;
    const folderSet = new Set<string>();
    entry.items.forEach((item) => {
      const normalized = item.path.replaceAll("\\", "/").split("/");
      for (let index = 1; index < normalized.length - 1; index += 1) {
        folderSet.add(normalized.slice(0, index + 1).join("/"));
      }
    });
    entry.folderCount = folderSet.size;
  });

  return order.map((key) => map.get(key)).filter((value): value is ContextGroup => Boolean(value));
}

export function buildTimelineEntries(chatMessages: ChatMessage[], contextGroups: ContextGroup[]): TimelineEntry[] {
  const mapped = [
    ...chatMessages.map((message) => ({
      id: `message:${message.id}`,
      type: "message" as const,
      createdAt: message.createdAt,
      message,
    })),
    ...contextGroups.map((group) => ({
      id: `context:${group.id}`,
      type: "context" as const,
      createdAt: group.createdAt,
      group,
    })),
  ];

  return mapped
    .map((entry, index) => ({ ...entry, index, timestamp: toTimestamp(entry.createdAt) }))
    .sort((a, b) => (a.timestamp === b.timestamp ? a.index - b.index : a.timestamp - b.timestamp));
}
