import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useChatStore } from "../store/use-chat-store";
import { useFilesStore } from "../store/use-files-store";
import { useUIStore } from "../store/use-ui-store";
import { resetHomeStores } from "../store/reset-home-stores";
import { parseFileWithPath } from "@/lib";

import { useHomeActions } from "./use-home-actions";

vi.mock("./use-home-ui-selectors", () => {
  const pushActivity = vi.fn();
  return {
    useHomeUiSelectors: vi.fn(() => ({
      t: {
        manualSaveSkipHistoryAnonymous: "skip",
        manualSaveDoneHistoryOnly: "done",
      },
      l: (ru: string, en: string) => en,
      pushActivity,
      totalTokens: 0,
      visibleItems: [],
      selectedItems: [],
    })),
    pushActivity,
  };
});

vi.mock("../store/history-storage", () => ({
  saveHistoryStorage: vi.fn(),
}));

import { saveHistoryStorage } from "../store/history-storage";

const saveHistoryStorageMock = vi.mocked(saveHistoryStorage);

let pushActivity: ReturnType<typeof vi.fn>;

vi.mock("@/lib", () => ({
  createId: vi.fn(() => "test-id"),
  combineToFinalTxt: vi.fn(() => "FINAL"),
  estimateTokens: vi.fn(() => 1),
  parseFileWithPath: vi.fn(async (file: File, path: string) => ({
    id: `parsed:${path}`,
    name: file.name,
    path,
    size: 1,
    kind: "file",
    text: "ok",
    tokenEstimate: 1,
    sourceType: "txt",
    addedAt: "2026-01-01T00:00:00.000Z",
  })),
}));

vi.mock("../model/home-actions-logic", () => ({
  buildHistoryShareUrl: vi.fn(() => "share-url"),
  normalizeCsvInput: vi.fn((value: string) => value.trim()),
  stripSyntheticFileHeader: vi.fn((text: string) => text),
  toTxtContext: vi.fn((text: string) => text),
}));

vi.mock("../model/home-logic", () => ({
  buildNextUntitledTitle: vi.fn(() => "Untitled 1"),
  deriveHistoryTitle: vi.fn(() => "History title"),
}));

vi.mock("../store/history-storage", () => ({
  saveHistoryStorage: vi.fn(),
}));

describe("useHomeActions", () => {
  beforeEach(async () => {
    resetHomeStores();
    const selectors = (await import("./use-home-ui-selectors")) as any;
    pushActivity = selectors.pushActivity;
    pushActivity.mockClear();
    saveHistoryStorageMock.mockClear();
  });

  it("does not save history when anonymous mode is enabled", async () => {
    useUIStore.setState({ anonymousMode: true });

    const { result } = renderHook(() => useHomeActions());

    await act(async () => {
      await result.current.manualSave();
    });

    expect(pushActivity).toHaveBeenCalledWith("skip");
    expect(saveHistoryStorageMock).not.toHaveBeenCalled();
  });

  it("saves history and calls storage on manualSave when not anonymous", async () => {
    useChatStore.setState({ prompt: "hello" });

    const { result } = renderHook(() => useHomeActions());

    await act(async () => {
      await result.current.manualSave();
    });

    expect(saveHistoryStorageMock).toHaveBeenCalled();
    const storedHistory = saveHistoryStorageMock.mock.calls[0][0];
    expect(Array.isArray(storedHistory)).toBe(true);
    expect(storedHistory[0]?.prompt).toBe("hello");
    expect(pushActivity).toHaveBeenCalledWith("done");
  });

  it("sendPrompt appends a chat message and clears the prompt", () => {
    useChatStore.setState({ prompt: "  hi " });

    const { result } = renderHook(() => useHomeActions());

    act(() => {
      result.current.sendPrompt();
    });

    const { prompt, chatMessages } = useChatStore.getState();
    expect(prompt).toBe("");
    expect(chatMessages).toHaveLength(1);
    expect(chatMessages[0]?.content).toBe("hi");
    expect(pushActivity).toHaveBeenCalledWith("Prompt sent to context timeline");
  });

  it("onCopy falls back to execCommand when clipboard.writeText throws", async () => {
    const clipboardSpy = vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("nope"));

    const originalExec = document.execCommand;
    // jsdom may not implement execCommand; ensure it exists for the test
    (document as any).execCommand = vi.fn(() => true);

    const { result } = renderHook(() => useHomeActions());

    await act(async () => {
      const success = await result.current.onCopy("x");
      expect(success).toBe(true);
    });

    clipboardSpy.mockRestore();
    (document as any).execCommand = originalExec;
  });

  it("handleFiles adds parsed items and reports errors", async () => {
    const parseMock = vi.mocked(parseFileWithPath);
    parseMock.mockResolvedValueOnce({
      id: "good",
      name: "good",
      path: "good.txt",
      size: 1,
      kind: "file",
      text: "ok",
      tokenEstimate: 1,
      sourceType: "txt",
      addedAt: "2026-01-01T00:00:00.000Z",
    });
    parseMock.mockResolvedValueOnce({
      id: "bad",
      name: "bad",
      path: "bad.txt",
      size: 1,
      kind: "file",
      text: "no",
      tokenEstimate: 1,
      sourceType: "txt",
      addedAt: "2026-01-01T00:00:00.000Z",
      error: "Something went wrong",
    });

    const file1 = new File(["a"], "good.txt", { type: "text/plain" });
    const file2 = new File(["b"], "bad.txt", { type: "text/plain" });

    const { result } = renderHook(() => useHomeActions());

    await act(async () => {
      await result.current.handleFiles([
        { file: file1, path: "good.txt" },
        { file: file2, path: "bad.txt" },
      ]);
    });

    expect(useFilesStore.getState().items).toHaveLength(1);
    expect(pushActivity).toHaveBeenCalledWith("Added to workspace: 1");
    expect(pushActivity).toHaveBeenCalledWith(expect.objectContaining({ status: "error" }));
  });
});
