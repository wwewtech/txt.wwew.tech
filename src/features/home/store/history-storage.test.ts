import { beforeEach, describe, expect, it, vi } from "vitest";

import { HISTORY_KEY, HISTORY_META_KEY } from "../model/page-constants";
import type { HistoryItem } from "../model/page-types";

vi.mock("idb", () => ({
  openDB: vi.fn(),
}));

function makeHistory(count: number): HistoryItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `h-${index + 1}`,
    title: `Chat ${index + 1}`,
    updatedAt: `2026-01-${String((index % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
    tokenEstimate: 100 + index,
    finalText: `final-${index + 1}`,
    prompt: `prompt-${index + 1}`,
    items: [],
    chatMessages: [],
  }));
}

type FakeDb = {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};

function makeFakeDb(history: HistoryItem[] | null = null): FakeDb {
  return {
    get: vi.fn().mockResolvedValue(history),
    put: vi.fn().mockResolvedValue(undefined),
  };
}

async function loadStorageModule() {
  const idb = await import("idb");
  const openDBMock = vi.mocked(idb.openDB);
  const storage = await import("./history-storage");
  return { openDBMock, ...storage };
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  window.localStorage.clear();

  Object.defineProperty(window, "indexedDB", {
    value: {},
    configurable: true,
  });
});

describe("history-storage", () => {
  it("saveHistoryStorage stores full history in IndexedDB and only metadata in localStorage", async () => {
    const history = makeHistory(35);
    const fakeDb = makeFakeDb();
    const { openDBMock, saveHistoryStorage } = await loadStorageModule();
    openDBMock.mockResolvedValue(fakeDb as never);

    await saveHistoryStorage(history);

    expect(fakeDb.put).toHaveBeenCalledTimes(1);
    const [, indexedPayload] = fakeDb.put.mock.calls[0] as [string, HistoryItem[], string];
    expect(indexedPayload).toHaveLength(30);
    expect(indexedPayload[0].id).toBe("h-1");
    expect(indexedPayload[29].id).toBe("h-30");

    const rawMeta = window.localStorage.getItem(HISTORY_META_KEY);
    expect(rawMeta).toBeTruthy();

    const meta = JSON.parse(rawMeta ?? "[]") as Array<Record<string, unknown>>;
    expect(meta).toHaveLength(30);
    expect(meta[0]).toEqual({
      id: "h-1",
      title: "Chat 1",
      updatedAt: "2026-01-01T00:00:00.000Z",
      tokenEstimate: 100,
    });
    expect(meta[0]).not.toHaveProperty("finalText");
    expect(meta[0]).not.toHaveProperty("items");
  });

  it("loadHistoryStorage prefers IndexedDB data when it is present", async () => {
    const indexedHistory = makeHistory(2);
    const fakeDb = makeFakeDb(indexedHistory);

    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(makeHistory(1)));

    const { openDBMock, loadHistoryStorage } = await loadStorageModule();
    openDBMock.mockResolvedValue(fakeDb as never);

    const loaded = await loadHistoryStorage();

    expect(loaded).toEqual(indexedHistory);
    expect(window.localStorage.getItem(HISTORY_KEY)).not.toBeNull();
  });

  it("loadHistoryStorage migrates legacy localStorage history when IndexedDB is empty", async () => {
    const legacyHistory = makeHistory(3);
    const fakeDb = makeFakeDb([]);

    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(legacyHistory));

    const { openDBMock, loadHistoryStorage } = await loadStorageModule();
    openDBMock.mockResolvedValue(fakeDb as never);

    const loaded = await loadHistoryStorage();

    expect(loaded).toEqual(legacyHistory);
    expect(fakeDb.put).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem(HISTORY_KEY)).toBeNull();
  });

  it("loadHistoryStorage falls back to legacy localStorage when IndexedDB throws", async () => {
    const legacyHistory = makeHistory(2);
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(legacyHistory));

    const { openDBMock, loadHistoryStorage } = await loadStorageModule();
    openDBMock.mockRejectedValue(new Error("idb unavailable"));

    const loaded = await loadHistoryStorage();

    expect(loaded).toEqual(legacyHistory);
    expect(window.localStorage.getItem(HISTORY_KEY)).toBeNull();
    expect(window.localStorage.getItem(HISTORY_META_KEY)).toBeTruthy();
  });

  it("loadHistoryStorage returns empty array for invalid legacy payload", async () => {
    const fakeDb = makeFakeDb(null);
    window.localStorage.setItem(HISTORY_KEY, "not-json");

    const { openDBMock, loadHistoryStorage } = await loadStorageModule();
    openDBMock.mockResolvedValue(fakeDb as never);

    const loaded = await loadHistoryStorage();

    expect(loaded).toEqual([]);
    expect(window.localStorage.getItem(HISTORY_KEY)).toBeNull();
  });
});
