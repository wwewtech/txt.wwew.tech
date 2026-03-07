import { describe, expect, it } from "vitest";

import type { ParsedItem } from "@/lib";

import {
  buildContextGroups,
  buildNextUntitledTitle,
  buildTimelineEntries,
  deriveHistoryTitle,
} from "./home-logic";
import type { ChatMessage, ContextGroup, HistoryItem } from "./page-types";

function makeFile(path: string, overrides: Partial<ParsedItem> = {}): ParsedItem {
  const name = path.split("/").at(-1) ?? path;
  return {
    id: `id-${path}`,
    name,
    path,
    size: 10,
    kind: "file",
    text: `### FILE: ${path}\n\nbody`,
    tokenEstimate: 3,
    sourceType: "txt",
    addedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeHistory(overrides: Partial<HistoryItem> = {}): HistoryItem {
  return {
    id: "h1",
    title: "Untitled 1",
    updatedAt: "2026-01-01T00:00:00.000Z",
    tokenEstimate: 1,
    finalText: "",
    prompt: "",
    items: [],
    chatMessages: [],
    ...overrides,
  };
}

describe("home-logic business rules", () => {
  it("buildNextUntitledTitle increments max untitled index", () => {
    const history: HistoryItem[] = [
      makeHistory({ title: "Conversation" }),
      makeHistory({ id: "h2", title: "Untitled 2" }),
      makeHistory({ id: "h3", title: "Untitled 7" }),
    ];

    expect(buildNextUntitledTitle(history)).toBe("Untitled 8");
  });

  it("deriveHistoryTitle preserves existing title", () => {
    const title = deriveHistoryTitle({
      existingTitle: "Pinned title",
      prompt: "new prompt",
      chatMessages: [{ id: "m1", role: "user", content: "chat", createdAt: "2026-01-01T00:00:00.000Z" }],
      items: [makeFile("workspace/a.txt")],
      nextUntitledTitle: "Untitled 4",
    });

    expect(title).toBe("Pinned title");
  });

  it("deriveHistoryTitle uses prompt > user message > context > untitled", () => {
    const promptTitle = deriveHistoryTitle({
      prompt: "  Use prompt first  ",
      chatMessages: [{ id: "m1", role: "user", content: "message title", createdAt: "2026-01-01T00:00:00.000Z" }],
      items: [makeFile("project/src/a.ts")],
      nextUntitledTitle: "Untitled 2",
    });
    expect(promptTitle).toBe("Use prompt first");

    const messageTitle = deriveHistoryTitle({
      prompt: "",
      chatMessages: [{ id: "m2", role: "user", content: "message title", createdAt: "2026-01-01T00:00:00.000Z" }],
      items: [makeFile("project/src/a.ts")],
      nextUntitledTitle: "Untitled 2",
    });
    expect(messageTitle).toBe("message title");

    const contextTitle = deriveHistoryTitle({
      prompt: "",
      chatMessages: [],
      items: [makeFile("project/src/a.ts")],
      nextUntitledTitle: "Untitled 2",
    });
    expect(contextTitle).toBe("project");

    const untitled = deriveHistoryTitle({
      prompt: "",
      chatMessages: [],
      items: [],
      nextUntitledTitle: "Untitled 2",
    });
    expect(untitled).toBe("Untitled 2");
  });

  it("buildContextGroups groups by root folder and keeps file/archive as separate groups", () => {
    const archiveChildren = [
      makeFile("pack.zip/apps/web/main.ts"),
      makeFile("pack.zip/apps/api/server.ts"),
    ];

    const archive: ParsedItem = {
      id: "arc-1",
      name: "pack.zip",
      path: "pack.zip",
      size: 20,
      kind: "archive",
      text: archiveChildren.map((entry) => entry.text).join("\n\n"),
      tokenEstimate: 6,
      sourceType: "zip",
      children: archiveChildren,
      addedAt: "2026-01-02T00:00:00.000Z",
    };

    const groups = buildContextGroups([
      makeFile("project/src/a.ts", { tokenEstimate: 10 }),
      makeFile("project/src/b.ts", { tokenEstimate: 20 }),
      makeFile("solo.txt"),
      archive,
    ]);

    const folder = groups.find((entry) => entry.kind === "folder") as ContextGroup;
    const file = groups.find((entry) => entry.kind === "file") as ContextGroup;
    const archiveGroup = groups.find((entry) => entry.kind === "archive") as ContextGroup;

    expect(folder.label).toBe("project");
    expect(folder.fileCount).toBe(2);
    expect(folder.tokenEstimate).toBe(30);
    expect(file.label).toBe("solo.txt");
    expect(archiveGroup.label).toBe("pack.zip");
    expect(archiveGroup.fileCount).toBe(2);
    expect(archiveGroup.folderCount).toBeGreaterThan(0);
  });

  it("buildTimelineEntries sorts by time and keeps stable order for ties", () => {
    const groups: ContextGroup[] = [
      {
        id: "group-1",
        label: "project",
        path: "project",
        kind: "folder",
        createdAt: "2026-01-01T00:00:01.000Z",
        fileCount: 1,
        folderCount: 0,
        tokenEstimate: 1,
        size: 1,
        items: [makeFile("project/a.ts")],
      },
    ];

    const messages: ChatMessage[] = [
      { id: "m1", role: "user", content: "first", createdAt: "2026-01-01T00:00:01.000Z" },
      { id: "m2", role: "assistant", content: "later", createdAt: "2026-01-01T00:00:05.000Z" },
    ];

    const entries = buildTimelineEntries(messages, groups);

    expect(entries[0].type).toBe("message");
    expect(entries[0].createdAt).toBe("2026-01-01T00:00:01.000Z");
    expect(entries[1].type).toBe("context");
    expect(entries[1].createdAt).toBe("2026-01-01T00:00:01.000Z");
    expect(entries[2].createdAt).toBe("2026-01-01T00:00:05.000Z");
  });
});
