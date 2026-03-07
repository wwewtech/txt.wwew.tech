import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { estimateTokens, type ParsedItem } from "@/lib";
import type { ChatMessage } from "../model/page-types";
import { useHomeUiSelectors } from "./use-home-ui-selectors";

function makeFileItem(path: string, overrides: Partial<ParsedItem> = {}): ParsedItem {
  const name = path.split("/").at(-1) ?? path;
  return {
    id: `id-${path}-${Math.random()}`,
    name,
    path,
    size: 100,
    kind: "file",
    text: `### FILE: ${path}\n\ncontent`,
    tokenEstimate: 25,
    sourceType: "txt",
    addedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("useHomeUiSelectors", () => {
  it("builds context groups for root folder, single file and archive", () => {
    const archiveChildren: ParsedItem[] = [
      makeFileItem("bundle.zip/apps/web/src/main.ts", { tokenEstimate: 4, size: 10 }),
      makeFileItem("bundle.zip/apps/api/src/server.ts", { tokenEstimate: 5, size: 11 }),
    ];

    const archiveItem: ParsedItem = {
      id: "archive-1",
      name: "bundle.zip",
      path: "bundle.zip",
      size: 21,
      kind: "archive",
      sourceType: "zip",
      text: archiveChildren.map((child) => child.text).join("\n\n"),
      tokenEstimate: 9,
      children: archiveChildren,
      addedAt: "2026-01-03T00:00:00.000Z",
    };

    const { result } = renderHook(() =>
      useHomeUiSelectors({
        language: "ru",
        markdownEnabled: true,
        items: [
          makeFileItem("project/src/a.ts", { tokenEstimate: 10, size: 300, addedAt: "2026-01-02T00:00:00.000Z" }),
          makeFileItem("solo.txt", { tokenEstimate: 3, size: 25, addedAt: "2026-01-01T00:00:00.000Z" }),
          archiveItem,
        ],
        prompt: "",
        chatMessages: [],
        bundleFilter: "",
        sortMode: "latest",
        showSkippedFiles: true,
        selectedItemIds: [],
        setActivity: vi.fn(),
      })
    );

    const groups = result.current.contextGroups;
    expect(groups).toHaveLength(3);

    const folder = groups.find((entry) => entry.kind === "folder");
    const singleFile = groups.find((entry) => entry.kind === "file");
    const archive = groups.find((entry) => entry.kind === "archive");

    expect(folder?.label).toBe("project");
    expect(folder?.fileCount).toBe(1);
    expect(singleFile?.label).toBe("solo.txt");
    expect(archive?.label).toBe("bundle.zip");
    expect(archive?.fileCount).toBe(2);
    expect(archive?.folderCount).toBeGreaterThan(0);
  });

  it("calculates totalTokens as context + user messages + draft prompt", () => {
    const userMessage: ChatMessage = {
      id: "m1",
      role: "user",
      content: "hello from user",
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    const assistantMessage: ChatMessage = {
      id: "m2",
      role: "assistant",
      content: "assistant text should not count",
      createdAt: "2026-01-01T00:00:01.000Z",
    };

    const { result } = renderHook(() =>
      useHomeUiSelectors({
        language: "ru",
        markdownEnabled: true,
        items: [makeFileItem("a.txt", { tokenEstimate: 11 })],
        prompt: "draft prompt",
        chatMessages: [userMessage, assistantMessage],
        bundleFilter: "",
        sortMode: "latest",
        showSkippedFiles: true,
        selectedItemIds: [],
        setActivity: vi.fn(),
      })
    );

    const expected =
      11 +
      estimateTokens("hello from user") +
      estimateTokens("draft prompt");

    expect(result.current.totalTokens).toBe(expected);
  });

  it("filters hidden skipped files and sorts by tokens descending", () => {
    const { result } = renderHook(() =>
      useHomeUiSelectors({
        language: "ru",
        markdownEnabled: true,
        items: [
          makeFileItem("b.txt", { tokenEstimate: 5 }),
          makeFileItem("skip.lock", { tokenEstimate: 0, error: "Skipped by filters" }),
          makeFileItem("a.txt", { tokenEstimate: 15 }),
        ],
        prompt: "",
        chatMessages: [],
        bundleFilter: "",
        sortMode: "tokens",
        showSkippedFiles: false,
        selectedItemIds: [],
        setActivity: vi.fn(),
      })
    );

    expect(result.current.visibleItems.map((entry) => entry.name)).toEqual(["a.txt", "b.txt"]);
  });

  it("sorts timeline entries by timestamp and keeps stable order for equal timestamps", () => {
    const { result } = renderHook(() =>
      useHomeUiSelectors({
        language: "ru",
        markdownEnabled: true,
        items: [
          makeFileItem("proj/a.ts", { addedAt: "2026-01-01T00:00:01.000Z" }),
        ],
        prompt: "",
        chatMessages: [
          { id: "m-late", role: "user", content: "late", createdAt: "2026-01-01T00:00:10.000Z" },
          { id: "m-early", role: "user", content: "early", createdAt: "2026-01-01T00:00:01.000Z" },
        ],
        bundleFilter: "",
        sortMode: "latest",
        showSkippedFiles: true,
        selectedItemIds: [],
        setActivity: vi.fn(),
      })
    );

    const entries = result.current.timelineEntries;
    expect(entries[0]?.createdAt).toBe("2026-01-01T00:00:01.000Z");
    expect(entries[0]?.type).toBe("message");
    expect(entries[1]?.createdAt).toBe("2026-01-01T00:00:01.000Z");
    expect(entries[1]?.type).toBe("context");
    expect(entries[2]?.createdAt).toBe("2026-01-01T00:00:10.000Z");
  });
});
