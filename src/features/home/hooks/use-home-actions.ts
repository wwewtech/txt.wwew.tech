"use client";

import * as React from "react";

import {
  combineToFinalTxt,
  estimateTokens,
  parseFileWithPath,
  type ParsedItem,
} from "@/lib";
import type { ContextGroup, HistoryItem } from "../model/page-types";
import type { UseHomeStateResult } from "./use-home-state";

const toBase64Unicode = (input: string) => {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

export function useHomeActions(state: UseHomeStateResult) {
  const {
    settings,
    pushActivity,
    l,
    setIsParsing,
    setProcessing,
    setItems,
    setSelectedItemIds,
    setFavoriteItemIds,
    setActivePreview,
    history,
    setEditDialog,
    editDialog,
    setHistory,
    currentChatId,
    setCurrentChatId,
    setPrompt,
    setChatMessages,
    autoSaveEnabled,
    saveToHistory,
    items,
    finalText,
    visibleItems,
    selectedItems,
    selectedItemIds,
    includePromptInResult,
    prompt,
    mounted,
    setOpenHistoryMenuId,
    setSettings,
  } = state;

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
        const addedAt = new Date().toISOString();
        const clean = parsed
          .filter((item) => !item.error || item.error === "Skipped by filters")
          .map((item) => ({ ...item, addedAt }));
        setItems((prev) => [...prev, ...clean]);
        pushActivity(l(`Добавлено в workspace: ${clean.length}`, `Added to workspace: ${clean.length}`));
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

  const toTxtContext = React.useCallback((content: string) => {
    return content
      .replace(/^### FILE: .*$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }, []);

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

  const editContextItems = React.useCallback((group: ContextGroup) => {
    const current = group.items.map((entry) => entry.text).filter(Boolean).join("\n\n");
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
      const primaryId = ids[0] ?? crypto.randomUUID();
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
      id: crypto.randomUUID(),
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
    const payload = {
      title: target.title,
      tokenEstimate: target.tokenEstimate,
      updatedAt: target.updatedAt,
      prompt: target.prompt,
    };
    const encoded = toBase64Unicode(JSON.stringify(payload));
    const url = `${window.location.origin}${window.location.pathname}#shared=${encoded}`;
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
        { id: crypto.randomUUID(), role: "user", content: trimmed, createdAt: now },
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
    pushActivity(l("Добавлена prompt-подсказка", "Prompt suggestion added"));
  }, [l, pushActivity, setPrompt]);

  const copyDraft = React.useCallback(async () => {
    await onCopy(finalText);
    pushActivity(l("Черновой контекст скопирован", "Draft context copied"));
  }, [finalText, l, onCopy, pushActivity]);

  const copyItemTxt = React.useCallback(async (item: ParsedItem) => {
    await onCopy(toTxtContext(item.text));
    pushActivity(l(`Скопирован TXT: ${item.name}`, `Copied TXT: ${item.name}`));
  }, [l, onCopy, pushActivity, toTxtContext]);

  const copyItemMd = React.useCallback(async (item: ParsedItem) => {
    await onCopy(item.text);
    pushActivity(l(`Скопирован MD: ${item.name}`, `Copied MD: ${item.name}`));
  }, [l, onCopy, pushActivity]);

  const downloadItemTxt = React.useCallback((item: ParsedItem) => {
    triggerDownload(`${item.name}.txt`, toTxtContext(item.text), "text/plain;charset=utf-8");
    pushActivity(l(`Скачан TXT: ${item.name}`, `Downloaded TXT: ${item.name}`));
  }, [l, pushActivity, toTxtContext, triggerDownload]);

  const editItem = React.useCallback((item: ParsedItem) => {
    setEditDialog({ mode: "context-item", value: item.text, item });
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
      ignoredDirectories: value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean),
    }));
  }, [setSettings]);

  const setExcludedExtensions = React.useCallback((value: string) => {
    setSettings((prev) => ({
      ...prev,
      excludedExtensions: value
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    }));
  }, [setSettings]);

  return {
    onCopy,
    handleFiles,
    onDrop,
    onFilePick,
    toTxtContext,
    triggerDownload,
    removeContextItems,
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
  };
}
