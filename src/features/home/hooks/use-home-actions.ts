"use client";

import * as React from "react";

import {
  combineToFinalTxt,
  createId,
  estimateTokens,
  parseFileWithPath,
  type ParsedItem,
} from "@/lib";
import {
  buildHistoryShareUrl,
  normalizeCsvInput,
  stripSyntheticFileHeader,
  toTxtContext,
} from "../model/home-actions-logic";
import { buildNextUntitledTitle, deriveHistoryTitle } from "../model/home-logic";
import type { ContextGroup, HistoryItem } from "../model/page-types";
import { saveHistoryStorage } from "../store/history-storage";
import { useChatStore } from "../store/use-chat-store";
import { useFilesStore } from "../store/use-files-store";
import { useUIStore } from "../store/use-ui-store";
import { useHomeUiSelectors } from "./use-home-ui-selectors";

export function useHomeActions() {
  const settings = useUIStore((state) => state.settings);
  const setSettings = useUIStore((state) => state.setSettings);
  const setIsParsing = useFilesStore((state) => state.setIsParsing);
  const setProcessing = useFilesStore((state) => state.setProcessing);
  const setItems = useFilesStore((state) => state.setItems);
  const setSelectedItemIds = useFilesStore((state) => state.setSelectedItemIds);
  const setFavoriteItemIds = useFilesStore((state) => state.setFavoriteItemIds);
  const setActivePreview = useFilesStore((state) => state.setActivePreview);
  const history = useUIStore((state) => state.history);
  const setEditDialog = useUIStore((state) => state.setEditDialog);
  const editDialog = useUIStore((state) => state.editDialog);
  const setHistory = useUIStore((state) => state.setHistory);
  const currentChatId = useChatStore((state) => state.currentChatId);
  const setCurrentChatId = useChatStore((state) => state.setCurrentChatId);
  const setPrompt = useChatStore((state) => state.setPrompt);
  const setChatMessages = useChatStore((state) => state.setChatMessages);
  const autoSaveEnabled = useUIStore((state) => state.autoSaveEnabled);
  const anonymousMode = useUIStore((state) => state.anonymousMode);
  const items = useFilesStore((state) => state.items);
  const selectedItemIds = useFilesStore((state) => state.selectedItemIds);
  const includePromptInResult = useChatStore((state) => state.includePromptInResult);
  const prompt = useChatStore((state) => state.prompt);
  const chatMessages = useChatStore((state) => state.chatMessages);
  const mounted = useUIStore((state) => state.mounted);
  const setOpenHistoryMenuId = useUIStore((state) => state.setOpenHistoryMenuId);
  const language = useUIStore((state) => state.language);
  const setSystemCommands = useUIStore((state) => state.setSystemCommands);
  const markdownEnabled = useUIStore((state) => state.markdownEnabled);
  const bundleFilter = useFilesStore((state) => state.bundleFilter);
  const sortMode = useFilesStore((state) => state.sortMode);
  const showSkippedFiles = useFilesStore((state) => state.showSkippedFiles);
  const setActivity = useUIStore((state) => state.setActivity);

  const {
    t,
    l,
    pushActivity,
    totalTokens,
    visibleItems,
    selectedItems,
  } = useHomeUiSelectors({
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
  });

  const finalText = React.useMemo(
    () =>
      combineToFinalTxt(
        items,
        includePromptInResult ? prompt : "",
        mounted ? new Date().toISOString() : undefined
      ),
    [items, includePromptInResult, prompt, mounted]
  );

  const nextUntitledTitle = React.useMemo(() => buildNextUntitledTitle(history), [history]);

  const upsertHistory = React.useCallback((entry: HistoryItem) => {
    setHistory((prev) => [entry, ...prev.filter((item) => item.id !== entry.id)].slice(0, 30));
  }, [setHistory]);

  const saveToHistory = React.useCallback(
    (force = false) => {
      if (anonymousMode) return;

      const hasCurrentContent = prompt.trim().length > 0 || items.length > 0 || chatMessages.length > 0;
      if (!hasCurrentContent && !force) return;

      const id = currentChatId ?? createId();
      const existingEntry = currentChatId ? history.find((entry) => entry.id === currentChatId) ?? null : null;
      const entry: HistoryItem = {
        id,
        title: deriveHistoryTitle({
          existingTitle: existingEntry?.title,
          prompt,
          chatMessages,
          items,
          nextUntitledTitle,
        }),
        updatedAt: new Date().toISOString(),
        tokenEstimate: totalTokens,
        finalText,
        prompt,
        items,
        chatMessages,
      };

      if (!currentChatId) setCurrentChatId(id);
      upsertHistory(entry);
    },
    [anonymousMode, chatMessages, currentChatId, finalText, history, items, nextUntitledTitle, prompt, totalTokens, setCurrentChatId, upsertHistory]
  );

  const onCopy = React.useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textarea);
        return success;
      } catch {
        return false;
      }
    }
  }, []);

  const handleFiles = React.useCallback(
    async (incoming: { file: File; path: string }[]) => {
      if (!incoming.length) return;
      setIsParsing(true);
      setProcessing(true);
      try {
        pushActivity(l(`Загрузка: ${incoming.length} шт.`, `Upload: ${incoming.length} item(s)`));
        const parsed = await Promise.all(
          incoming.map((entry) => parseFileWithPath(entry.file, entry.path, settings))
        );
        const failed = parsed.filter((item) => item.error && item.error !== "Skipped by filters");
        const addedAt = new Date().toISOString();
        const clean = parsed
          .filter((item) => !item.error || item.error === "Skipped by filters")
          .map((item) => ({ ...item, addedAt }));
        setItems((prev) => [...prev, ...clean]);
        pushActivity(l(`Добавлено в workspace: ${clean.length}`, `Added to workspace: ${clean.length}`));
        if (failed.length) {
          const preview = failed
            .slice(0, 3)
            .map((item) => `${item.name}: ${item.error}`)
            .join("; ");
          pushActivity(
            l(
              `Ошибки парсинга: ${failed.length}${preview ? ` (${preview})` : ""}`,
              `Parse failed: ${failed.length}${preview ? ` (${preview})` : ""}`
            )
          );
        }
      } finally {
        setIsParsing(false);
        setProcessing(false);
      }
    },
    [l, pushActivity, setIsParsing, setItems, setProcessing, settings]
  );

  const onDrop = React.useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const dropped = Array.from(event.dataTransfer.files);
      const list = dropped.map((file) => ({
        file,
        path: file.webkitRelativePath || file.name,
      }));
      await handleFiles(list);
    },
    [handleFiles]
  );

  const onFilePick = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(event.target.files ?? []);
      const payload = selected.map((file) => ({
        file,
        path: file.webkitRelativePath || file.name,
      }));
      await handleFiles(payload);
      event.target.value = "";
    },
    [handleFiles]
  );

  const triggerDownload = React.useCallback((fileName: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const removeContextItems = React.useCallback((ids: string[], label: string) => {
    if (!ids.length) return;
    const idSet = new Set(ids);
    setItems((prev) => prev.filter((entry) => !idSet.has(entry.id)));
    setSelectedItemIds((prev) => prev.filter((id) => !idSet.has(id)));
    setFavoriteItemIds((prev) => prev.filter((id) => !idSet.has(id)));
    setActivePreview((prev) => (prev && idSet.has(prev.id) ? null : prev));
    pushActivity(l(`Удален контекст: ${label}`, `Context removed: ${label}`));
  }, [l, pushActivity, setActivePreview, setFavoriteItemIds, setItems, setSelectedItemIds]);

  const removeMessage = React.useCallback((id: string) => {
    setChatMessages((prev) => prev.filter((m) => m.id !== id));
    pushActivity(l(`Удалено сообщение`, `Message removed`));
  }, [l, pushActivity, setChatMessages]);

  const editContextItems = React.useCallback((group: ContextGroup) => {
    const current = group.items
      .map((entry) => stripSyntheticFileHeader(entry.text))
      .filter(Boolean)
      .join("\n\n");
    setEditDialog({ mode: "context-group", value: current, group });
  }, [setEditDialog]);

  const renameHistoryItem = React.useCallback((id: string) => {
    const target = history.find((entry) => entry.id === id);
    if (!target) return;
    setEditDialog({ mode: "history-rename", value: target.title, historyId: id });
  }, [history, setEditDialog]);

  const submitEditDialog = React.useCallback(() => {
    if (!editDialog) return;
    const edited = editDialog.value.trim();
    if (!edited) return;

    if (editDialog.mode === "context-group") {
      const group = editDialog.group;
      const ids = group.items.map((entry) => entry.id);
      const idSet = new Set(ids);
      const primaryId = ids[0] ?? createId();
      const replacement: ParsedItem = {
        id: primaryId,
        name: group.label,
        path: group.path,
        size: edited.length,
        kind: "file",
        text: edited,
        tokenEstimate: estimateTokens(edited),
        sourceType: "md",
        addedAt: new Date().toISOString(),
      };

      setItems((prev) => {
        const nextItems: ParsedItem[] = [];
        let inserted = false;

        prev.forEach((entry) => {
          if (!idSet.has(entry.id)) {
            nextItems.push(entry);
            return;
          }

          if (!inserted) {
            nextItems.push(replacement);
            inserted = true;
          }
        });

        if (!inserted) nextItems.push(replacement);
        return nextItems;
      });

      setSelectedItemIds((prev) => {
        const kept = prev.filter((id) => !idSet.has(id));
        return kept.includes(primaryId) ? kept : [...kept, primaryId];
      });
      setFavoriteItemIds((prev) => {
        const kept = prev.filter((id) => !idSet.has(id));
        return kept.includes(primaryId) ? kept : [...kept, primaryId];
      });
      setActivePreview((prev) => (prev && idSet.has(prev.id) ? replacement : prev));
      pushActivity(l(`Контекст изменен: ${group.label}`, `Context updated: ${group.label}`));
      setEditDialog(null);
      return;
    }

    if (editDialog.mode === "context-item") {
      const item = editDialog.item;
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                text: edited,
                size: edited.length,
                tokenEstimate: estimateTokens(edited),
              }
            : entry
        )
      );
      setActivePreview((prev) =>
        prev?.id === item.id
          ? {
              ...prev,
              text: edited,
              size: edited.length,
              tokenEstimate: estimateTokens(edited),
            }
          : prev
      );
      pushActivity(l(`Контекст изменен: ${item.name}`, `Context updated: ${item.name}`));
      setEditDialog(null);
      return;
    }

    setHistory((prev) =>
      prev.map((entry) =>
        entry.id === editDialog.historyId
          ? { ...entry, title: edited.slice(0, 80), updatedAt: new Date().toISOString() }
          : entry
      )
    );
    setEditDialog(null);
  }, [editDialog, l, pushActivity, setActivePreview, setEditDialog, setFavoriteItemIds, setHistory, setItems, setSelectedItemIds]);

  const duplicateHistoryItem = React.useCallback((id: string) => {
    const target = history.find((entry) => entry.id === id);
    if (!target) return;
    const duplicate: HistoryItem = {
      ...target,
      id: createId(),
      title: `${target.title} (copy)`.slice(0, 80),
      updatedAt: new Date().toISOString(),
      items: [...target.items],
      chatMessages: [...(target.chatMessages ?? [])],
    };
    setHistory((prev) => [duplicate, ...prev]);
  }, [history, setHistory]);

  const resetCurrentSession = React.useCallback(() => {
    setPrompt("");
    setItems([]);
    setChatMessages([]);
    setCurrentChatId(null);
    setSelectedItemIds([]);
    setFavoriteItemIds([]);
    setActivePreview(null);
  }, [setActivePreview, setChatMessages, setCurrentChatId, setFavoriteItemIds, setItems, setPrompt, setSelectedItemIds]);

  const deleteHistoryItem = React.useCallback((id: string) => {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
    if (currentChatId === id) {
      resetCurrentSession();
    }
  }, [currentChatId, resetCurrentSession, setHistory]);

  const shareHistoryItem = React.useCallback(async (id: string) => {
    const target = history.find((entry) => entry.id === id);
    if (!target) return;
    const url = buildHistoryShareUrl(target, window.location.origin, window.location.pathname);
    const copied = await onCopy(url);
    pushActivity(copied ? l("Ссылка чата скопирована", "Chat link copied") : l("Не удалось скопировать ссылку", "Failed to copy chat link"));
  }, [history, l, onCopy, pushActivity]);

  const exportTxt = React.useCallback(() => {
    const blob = new Blob([finalText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `llm-context-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    pushActivity(l("Экспортирован итоговый TXT", "Final TXT exported"));
  }, [finalText, l, pushActivity]);

  const toggleSelectItem = React.useCallback((id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  }, [setSelectedItemIds]);

  const toggleFavoriteItem = React.useCallback((id: string) => {
    setFavoriteItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  }, [setFavoriteItemIds]);

  const selectAllVisible = React.useCallback(() => {
    setSelectedItemIds(visibleItems.map((item) => item.id));
    pushActivity(l(`Выбрано видимых: ${visibleItems.length}`, `Selected visible: ${visibleItems.length}`));
  }, [l, pushActivity, setSelectedItemIds, visibleItems]);

  const quickBuild = React.useCallback(async () => {
    if (!items.length) return;
    const copied = await onCopy(finalText);
    pushActivity(copied ? l("Быстрая сборка: контекст скопирован", "Quick build: context copied") : l("Быстрая сборка: не удалось скопировать", "Quick build: copy failed"));
  }, [finalText, items.length, l, onCopy, pushActivity]);

  const sendPrompt = React.useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    const now = new Date().toISOString();
    setChatMessages((prev) => {
      return [
        ...prev,
        { id: createId(), role: "user", content: trimmed, createdAt: now },
      ];
    });
    pushActivity(l("Prompt отправлен в контекстную ленту", "Prompt sent to context timeline"));
    if (autoSaveEnabled) {
      saveToHistory(true);
    }
    setPrompt("");
  }, [autoSaveEnabled, l, prompt, pushActivity, saveToHistory, setChatMessages, setPrompt]);

  const startNewChat = React.useCallback(() => {
    if (autoSaveEnabled) {
      saveToHistory();
    }
    resetCurrentSession();
    pushActivity(l("Новый чат", "New chat"));
  }, [autoSaveEnabled, l, pushActivity, resetCurrentSession, saveToHistory]);

  const selectHistory = React.useCallback((entry: HistoryItem) => {
    setCurrentChatId(entry.id);
    setPrompt(entry.prompt);
    setItems(entry.items ?? []);
    setChatMessages(entry.chatMessages ?? []);
    setSelectedItemIds([]);
    setFavoriteItemIds([]);
    setActivePreview(null);
    setOpenHistoryMenuId(null);
  }, [setActivePreview, setChatMessages, setCurrentChatId, setFavoriteItemIds, setItems, setOpenHistoryMenuId, setPrompt, setSelectedItemIds]);

  const buildSelected = React.useCallback(async () => {
    const text = combineToFinalTxt(
      selectedItems,
      includePromptInResult ? prompt : "",
      mounted ? new Date().toISOString() : undefined
    );
    await onCopy(text);
    pushActivity(l(`Собран selected: ${selectedItems.length}`, `Built selected: ${selectedItems.length}`));
  }, [includePromptInResult, l, mounted, onCopy, prompt, pushActivity, selectedItems]);

  const removeSelected = React.useCallback(() => {
    if (!selectedItems.length) return;
    setItems((prev) => prev.filter((item) => !selectedItemIds.includes(item.id)));
    pushActivity(l(`Удалено selected: ${selectedItems.length}`, `Removed selected: ${selectedItems.length}`));
    setSelectedItemIds([]);
  }, [l, pushActivity, selectedItemIds, selectedItems.length, setItems, setSelectedItemIds]);

  const addPromptSuggestion = React.useCallback((item: string) => {
    setPrompt((prev) => (prev ? `${prev}\n${item}` : item));
    pushActivity(l("Добавлена команда", "Command applied"));
  }, [l, pushActivity, setPrompt]);

  const addSystemCommand = React.useCallback((text: string) => {
    setSystemCommands((prev) => [...prev, text]);
  }, [setSystemCommands]);

  const removeSystemCommand = React.useCallback((index: number) => {
    setSystemCommands((prev) => prev.filter((_, i) => i !== index));
  }, [setSystemCommands]);

  const updateSystemCommand = React.useCallback((index: number, text: string) => {
    setSystemCommands((prev) => prev.map((cmd, i) => (i === index ? text : cmd)));
  }, [setSystemCommands]);

  const copyDraft = React.useCallback(async () => {
    await onCopy(finalText);
    pushActivity(l("Черновой контекст скопирован", "Draft context copied"));
  }, [finalText, l, onCopy, pushActivity]);

  const copyItemTxt = React.useCallback(async (item: ParsedItem) => {
    await onCopy(toTxtContext(item.text));
    pushActivity(l(`Скопирован TXT: ${item.name}`, `Copied TXT: ${item.name}`));
  }, [l, onCopy, pushActivity]);

  const copyItemMd = React.useCallback(async (item: ParsedItem) => {
    await onCopy(item.text);
    pushActivity(l(`Скопирован MD: ${item.name}`, `Copied MD: ${item.name}`));
  }, [l, onCopy, pushActivity]);

  const downloadItemTxt = React.useCallback((item: ParsedItem) => {
    triggerDownload(`${item.name}.txt`, toTxtContext(item.text), "text/plain;charset=utf-8");
    pushActivity(l(`Скачан TXT: ${item.name}`, `Downloaded TXT: ${item.name}`));
  }, [l, pushActivity, triggerDownload]);

  const editItem = React.useCallback((item: ParsedItem) => {
    setEditDialog({ mode: "context-item", value: stripSyntheticFileHeader(item.text), item });
  }, [setEditDialog]);

  const deletePreviewItem = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((entry) => entry.id !== id));
    setActivePreview(null);
  }, [setActivePreview, setItems]);

  const previewGroup = React.useCallback((group: ContextGroup, joinedText: string) => {
    setActivePreview({
      id: group.id,
      name: group.label,
      path: group.path,
      kind: "archive",
      size: group.size,
      sourceType: group.kind,
      tokenEstimate: group.tokenEstimate,
      text: joinedText,
      children: group.items,
    });
  }, [setActivePreview]);

  const copyHistoryPrompt = React.useCallback(async (id: string) => {
    const target = history.find((entry) => entry.id === id);
    await onCopy(target?.prompt || "");
    setOpenHistoryMenuId(null);
  }, [history, onCopy, setOpenHistoryMenuId]);

  const copyHistoryFinal = React.useCallback(async (id: string) => {
    const target = history.find((entry) => entry.id === id);
    await onCopy(target?.finalText || "");
    setOpenHistoryMenuId(null);
  }, [history, onCopy, setOpenHistoryMenuId]);

  const setIgnoredDirectories = React.useCallback((value: string) => {
    setSettings((prev) => ({
      ...prev,
      ignoredDirectories: normalizeCsvInput(value),
    }));
  }, [setSettings]);

  const setExcludedExtensions = React.useCallback((value: string) => {
    setSettings((prev) => ({
      ...prev,
      excludedExtensions: normalizeCsvInput(value, { lowercase: true }),
    }));
  }, [setSettings]);

  const manualSave = React.useCallback(
    async () => {
      if (anonymousMode) {
        pushActivity(t.manualSaveSkipHistoryAnonymous);
        return;
      }

      saveToHistory(true);
      const nextHistory = useUIStore.getState().history;
      await saveHistoryStorage(nextHistory);
      pushActivity(t.manualSaveDoneHistoryOnly);
    },
    [anonymousMode, pushActivity, saveToHistory, t.manualSaveDoneHistoryOnly, t.manualSaveSkipHistoryAnonymous]
  );

  return {
    onCopy,
    handleFiles,
    onDrop,
    onFilePick,
    toTxtContext,
    triggerDownload,
    removeContextItems,
    removeMessage,
    editContextItems,
    renameHistoryItem,
    submitEditDialog,
    duplicateHistoryItem,
    deleteHistoryItem,
    shareHistoryItem,
    exportTxt,
    toggleSelectItem,
    toggleFavoriteItem,
    selectAllVisible,
    quickBuild,
    sendPrompt,
    resetCurrentSession,
    startNewChat,
    selectHistory,
    buildSelected,
    removeSelected,
    addPromptSuggestion,
    addSystemCommand,
    removeSystemCommand,
    updateSystemCommand,
    copyDraft,
    copyItemTxt,
    copyItemMd,
    downloadItemTxt,
    editItem,
    deletePreviewItem,
    previewGroup,
    copyHistoryPrompt,
    copyHistoryFinal,
    setIgnoredDirectories,
    setExcludedExtensions,
    manualSave,
  };
}
