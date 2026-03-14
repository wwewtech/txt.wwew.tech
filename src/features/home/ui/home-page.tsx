"use client";

import * as React from "react";
import { cn } from "@/lib";
import { MobileDrawer } from "@/components";
import { HomeEditDialog } from "./home-edit-dialog";
import { HomeLeftSidebar } from "./home-left-sidebar";
import { HomeMainPanel } from "./home-main-panel";
import { HomePreviewModal } from "./home-preview-modal";
import { HomeRightSidebar } from "@/features/home/ui/home-right-sidebar";
import { useHomeActions } from "../hooks/use-home-actions";
import { useHomeRuntimeEffects } from "../hooks/use-home-runtime-effects";
import { useHomeUiSelectors } from "../hooks/use-home-ui-selectors";
import { useChatStore } from "../store/use-chat-store";
import { useFilesStore } from "../store/use-files-store";
import { useUIStore } from "../store/use-ui-store";

export default function Home() {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const folderInputRef = React.useRef<HTMLInputElement | null>(null);
  const composerRef = React.useRef<HTMLTextAreaElement | null>(null);

  const leftCollapsed = useUIStore((state) => state.leftCollapsed);
  const setLeftCollapsed = useUIStore((state) => state.setLeftCollapsed);
  const mobileLeftOpen = useUIStore((state) => state.mobileLeftOpen);
  const setMobileLeftOpen = useUIStore((state) => state.setMobileLeftOpen);
  const mobileRightOpen = useUIStore((state) => state.mobileRightOpen);
  const setMobileRightOpen = useUIStore((state) => state.setMobileRightOpen);
  const rightSidebarOpen = useUIStore((state) => state.rightSidebarOpen);
  const setRightSidebarOpen = useUIStore((state) => state.setRightSidebarOpen);
  const rightSidebarWidth = useUIStore((state) => state.rightSidebarWidth);
  const setResizingSidebar = useUIStore((state) => state.setResizingSidebar);
  const language = useUIStore((state) => state.language);
  const setLanguage = useUIStore((state) => state.setLanguage);
  const markdownEnabled = useUIStore((state) => state.markdownEnabled);
  const setMarkdownEnabled = useUIStore((state) => state.setMarkdownEnabled);
  const history = useUIStore((state) => state.history);
  const currentChatId = useChatStore((state) => state.currentChatId);
  const openHistoryMenuId = useUIStore((state) => state.openHistoryMenuId);
  const setOpenHistoryMenuId = useUIStore((state) => state.setOpenHistoryMenuId);
  const settings = useUIStore((state) => state.settings);
  const activity = useUIStore((state) => state.activity);
  const setActivity = useUIStore((state) => state.setActivity);
  const autoSaveEnabled = useUIStore((state) => state.autoSaveEnabled);
  const setAutoSaveEnabled = useUIStore((state) => state.setAutoSaveEnabled);
  const anonymousMode = useUIStore((state) => state.anonymousMode);
  const setAnonymousMode = useUIStore((state) => state.setAnonymousMode);
  const editDialog = useUIStore((state) => state.editDialog);
  const setEditDialog = useUIStore((state) => state.setEditDialog);
  const uiScale = useUIStore((state) => state.uiScale);
  const setUiScale = useUIStore((state) => state.setUiScale);
  const compactMode = useUIStore((state) => state.compactMode);
  const setCompactMode = useUIStore((state) => state.setCompactMode);
  const fontSizeOffset = useUIStore((state) => state.fontSizeOffset);
  const setFontSizeOffset = useUIStore((state) => state.setFontSizeOffset);
  const fontSizeScope = useUIStore((state) => state.fontSizeScope);
  const setFontSizeScope = useUIStore((state) => state.setFontSizeScope);
  const scrollOnSend = useUIStore((state) => state.scrollOnSend);
  const setScrollOnSend = useUIStore((state) => state.setScrollOnSend);
  const sendKey = useUIStore((state) => state.sendKey);
  const setSendKey = useUIStore((state) => state.setSendKey);

  const prompt = useChatStore((state) => state.prompt);
  const setPrompt = useChatStore((state) => state.setPrompt);
  const chatMessages = useChatStore((state) => state.chatMessages);
  const includePromptInResult = useChatStore((state) => state.includePromptInResult);
  const setIncludePromptInResult = useChatStore((state) => state.setIncludePromptInResult);

  const items = useFilesStore((state) => state.items);
  const activePreview = useFilesStore((state) => state.activePreview);
  const setActivePreview = useFilesStore((state) => state.setActivePreview);
  const isParsing = useFilesStore((state) => state.isParsing);
  const processing = useFilesStore((state) => state.processing);
  const bundleFilter = useFilesStore((state) => state.bundleFilter);
  const setBundleFilter = useFilesStore((state) => state.setBundleFilter);
  const sortMode = useFilesStore((state) => state.sortMode);
  const setSortMode = useFilesStore((state) => state.setSortMode);
  const viewMode = useFilesStore((state) => state.viewMode);
  const setViewMode = useFilesStore((state) => state.setViewMode);
  const selectedItemIds = useFilesStore((state) => state.selectedItemIds);
  const favoriteItemIds = useFilesStore((state) => state.favoriteItemIds);
  const showSkippedFiles = useFilesStore((state) => state.showSkippedFiles);
  const setShowSkippedFiles = useFilesStore((state) => state.setShowSkippedFiles);

  useHomeRuntimeEffects({ composerRef, prompt });

  const actions = useHomeActions();

  const {
    t,
    l,
    totalTokens,
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

  const scrollToItem = React.useCallback(
    (itemId: string) => {
      const entry = timelineEntries.find(
        (e) => e.type === "context" && e.group.items.some((i) => i.id === itemId)
      );
      if (!entry) return;
      document.getElementById(entry.id)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },
    [timelineEntries]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile drawers — видны только на < xl */}
      <MobileDrawer
        open={mobileLeftOpen}
        onOpenChange={setMobileLeftOpen}
        direction="left"
      >
        <HomeLeftSidebar
          t={t}
          language={language}
          onLanguageChange={setLanguage}
          history={history}
          currentChatId={currentChatId}
          openHistoryMenuId={openHistoryMenuId}
          onCollapseLeft={() => setMobileLeftOpen(false)}
          onStartNewChat={() => { actions.startNewChat(); setMobileLeftOpen(false); }}
          onSelectHistory={(entry) => { actions.selectHistory(entry); setMobileLeftOpen(false); }}
          onToggleHistoryMenu={(id) => setOpenHistoryMenuId((prev) => (prev === id ? null : id))}
          onDuplicateHistoryItem={(id) => {
            actions.duplicateHistoryItem(id);
            setOpenHistoryMenuId(null);
          }}
          onShareHistoryItem={async (id) => {
            await actions.shareHistoryItem(id);
            setOpenHistoryMenuId(null);
          }}
          onRenameHistoryItem={(id) => {
            actions.renameHistoryItem(id);
            setOpenHistoryMenuId(null);
          }}
          onCopyHistoryPrompt={actions.copyHistoryPrompt}
          onCopyHistoryFinal={actions.copyHistoryFinal}
          onDeleteHistoryItem={(id) => {
            actions.deleteHistoryItem(id);
            setOpenHistoryMenuId(null);
          }}
          fontSizeOffset={fontSizeOffset}
          fontSizeScope={fontSizeScope}
          drawerMode
        />
      </MobileDrawer>

      <MobileDrawer
        open={mobileRightOpen}
        onOpenChange={setMobileRightOpen}
        direction="right"
      >
        <HomeRightSidebar
          t={t}
          rightSidebarWidth={320}
          items={items}
          processing={processing}
          systemCommands={systemCommands}
          bundleFilter={bundleFilter}
          sortMode={sortMode}
          viewMode={viewMode}
          visibleItems={visibleItems}
          selectedItems={selectedItems}
          skippedFiles={skippedFiles}
          selectedItemIds={selectedItemIds}
          totalFiles={totalFiles}
          totalBytes={totalBytes}
          totalTokens={totalTokens}
          activity={activity}
          autoSaveEnabled={autoSaveEnabled}
          anonymousMode={anonymousMode}
          includePromptInResult={includePromptInResult}
          showSkippedFiles={showSkippedFiles}
          settings={settings}
          onCloseRight={() => setMobileRightOpen(false)}
          onSetBundleFilter={setBundleFilter}
          onSetSortMode={setSortMode}
          onSetViewMode={setViewMode}
          onSelectAllVisible={actions.selectAllVisible}
          onBuildSelected={actions.buildSelected}
          onRemoveSelected={actions.removeSelected}
          onApplyCommand={actions.addPromptSuggestion}
          onAddSystemCommand={actions.addSystemCommand}
          onRemoveSystemCommand={actions.removeSystemCommand}
          onUpdateSystemCommand={actions.updateSystemCommand}
          onQuickBuild={actions.quickBuild}
          onCopyDraft={actions.copyDraft}
          onToggleSelectItem={actions.toggleSelectItem}
          onScrollToItem={scrollToItem}
          onToggleAutoSave={() => setAutoSaveEnabled((value) => !value)}
          onToggleAnonymousMode={() => setAnonymousMode(!anonymousMode)}
          onSetIgnoredDirectories={actions.setIgnoredDirectories}
          onSetExcludedExtensions={actions.setExcludedExtensions}
          onSetIncludePromptInResult={setIncludePromptInResult}
          onSetShowSkippedFiles={setShowSkippedFiles}
          onBytesToText={bytesToText}
          uiScale={uiScale}
          compactMode={compactMode}
          fontSizeOffset={fontSizeOffset}
          fontSizeScope={fontSizeScope}
          onSetUiScale={setUiScale}
          onSetCompactMode={setCompactMode}
          onSetFontSizeOffset={setFontSizeOffset}
          onSetFontSizeScope={setFontSizeScope}
          scrollOnSend={scrollOnSend}
          sendKey={sendKey}
          onSetScrollOnSend={setScrollOnSend}
          onSetSendKey={setSendKey}
          drawerMode
        />
      </MobileDrawer>

      <div
        style={{ ["--right-sidebar-width" as string]: `${rightSidebarWidth}px` }}
        className={cn(
          "grid min-h-screen grid-cols-1",
          rightSidebarOpen
            ? leftCollapsed
              ? "xl:grid-cols-[minmax(0,1fr)_1px_var(--right-sidebar-width)]"
              : "xl:grid-cols-[280px_minmax(0,1fr)_1px_var(--right-sidebar-width)]"
            : leftCollapsed
              ? "xl:grid-cols-[minmax(0,1fr)]"
              : "xl:grid-cols-[280px_minmax(0,1fr)]"
        )}
      >
        {!leftCollapsed && (
          <HomeLeftSidebar
            t={t}
            language={language}
            onLanguageChange={setLanguage}
            history={history}
            currentChatId={currentChatId}
            openHistoryMenuId={openHistoryMenuId}
            onCollapseLeft={() => setLeftCollapsed(true)}
            onStartNewChat={actions.startNewChat}
            onSelectHistory={actions.selectHistory}
            onToggleHistoryMenu={(id) => setOpenHistoryMenuId((prev) => (prev === id ? null : id))}
            onDuplicateHistoryItem={(id) => {
              actions.duplicateHistoryItem(id);
              setOpenHistoryMenuId(null);
            }}
            onShareHistoryItem={async (id) => {
              await actions.shareHistoryItem(id);
              setOpenHistoryMenuId(null);
            }}
            onRenameHistoryItem={(id) => {
              actions.renameHistoryItem(id);
              setOpenHistoryMenuId(null);
            }}
            onCopyHistoryPrompt={actions.copyHistoryPrompt}
            onCopyHistoryFinal={actions.copyHistoryFinal}
            onDeleteHistoryItem={(id) => {
              actions.deleteHistoryItem(id);
              setOpenHistoryMenuId(null);
            }}
            fontSizeOffset={fontSizeOffset}
            fontSizeScope={fontSizeScope}
          />
        )}

        <HomeMainPanel
          t={t}
          leftCollapsed={leftCollapsed}
          rightSidebarOpen={rightSidebarOpen}
          totalTokens={totalTokens}
          markdownEnabled={markdownEnabled}
          timelineEntries={timelineEntries}
          prompt={prompt}
          isParsing={isParsing}
          fileInputRef={fileInputRef}
          folderInputRef={folderInputRef}
          composerRef={composerRef}
          renderMessageBody={renderMessageBody}
          bytesToText={bytesToText}
          onExpandLeft={() => setLeftCollapsed(false)}
          onOpenRight={() => setRightSidebarOpen(true)}
          onOpenMobileLeft={() => setMobileLeftOpen(true)}
          onOpenMobileRight={() => setMobileRightOpen(true)}
          onToggleMarkdown={() => setMarkdownEnabled((value) => !value)}
          onDrop={actions.onDrop}
          onPreviewItem={setActivePreview}
          onPreviewGroup={actions.previewGroup}
          onCopy={actions.onCopy}
          onToTxtContext={actions.toTxtContext}
          onPushActivity={pushActivity}
          l={l}
          onTriggerDownload={actions.triggerDownload}
          onEditContextGroup={actions.editContextItems}
          onEditContextItem={actions.editItem}
          onRemoveContextItems={actions.removeContextItems}
          onRemoveMessage={actions.removeMessage}
          onFilePick={actions.onFilePick}
          onPromptChange={setPrompt}
          onSendPrompt={actions.sendPrompt}
          onExportTxt={actions.exportTxt}
          scrollOnSend={scrollOnSend}
          sendKey={sendKey}
        />

        {rightSidebarOpen && (
          <>
            <div
              role="separator"
              aria-orientation="vertical"
              className="hidden w-px shrink-0 cursor-col-resize bg-border/50 transition-colors hover:bg-primary/30 xl:block"
              onMouseDown={(event) => {
                event.preventDefault();
                setResizingSidebar("right");
              }}
            />
            <HomeRightSidebar
              t={t}
              rightSidebarWidth={rightSidebarWidth}
              items={items}
              processing={processing}
              systemCommands={systemCommands}
              bundleFilter={bundleFilter}
              sortMode={sortMode}
              viewMode={viewMode}
              visibleItems={visibleItems}
              selectedItems={selectedItems}
              skippedFiles={skippedFiles}
              selectedItemIds={selectedItemIds}
              totalFiles={totalFiles}
              totalBytes={totalBytes}
              totalTokens={totalTokens}
              activity={activity}
              autoSaveEnabled={autoSaveEnabled}
              anonymousMode={anonymousMode}
              includePromptInResult={includePromptInResult}
              showSkippedFiles={showSkippedFiles}
              settings={settings}
              onCloseRight={() => setRightSidebarOpen(false)}
              onSetBundleFilter={setBundleFilter}
              onSetSortMode={setSortMode}
              onSetViewMode={setViewMode}
              onSelectAllVisible={actions.selectAllVisible}
              onBuildSelected={actions.buildSelected}
              onRemoveSelected={actions.removeSelected}
              onApplyCommand={actions.addPromptSuggestion}
              onAddSystemCommand={actions.addSystemCommand}
              onRemoveSystemCommand={actions.removeSystemCommand}
              onUpdateSystemCommand={actions.updateSystemCommand}
              onQuickBuild={actions.quickBuild}
              onCopyDraft={actions.copyDraft}
              onToggleSelectItem={actions.toggleSelectItem}
              onScrollToItem={scrollToItem}
              onToggleAutoSave={() => setAutoSaveEnabled((value) => !value)}
              onToggleAnonymousMode={() => setAnonymousMode(!anonymousMode)}
              onSetIgnoredDirectories={actions.setIgnoredDirectories}
              onSetExcludedExtensions={actions.setExcludedExtensions}
              onSetIncludePromptInResult={setIncludePromptInResult}
              onSetShowSkippedFiles={setShowSkippedFiles}
              onBytesToText={bytesToText}
              uiScale={uiScale}
              compactMode={compactMode}
              fontSizeOffset={fontSizeOffset}
              fontSizeScope={fontSizeScope}
              onSetUiScale={setUiScale}
              onSetCompactMode={setCompactMode}
              onSetFontSizeOffset={setFontSizeOffset}
              onSetFontSizeScope={setFontSizeScope}
              scrollOnSend={scrollOnSend}
              sendKey={sendKey}
              onSetScrollOnSend={setScrollOnSend}
              onSetSendKey={setSendKey}
            />
          </>
        )}
      </div>

      {activePreview && (
        <HomePreviewModal
          activePreview={activePreview}
          t={t}
          renderMessageBody={renderMessageBody}
          onCopy={(value) => {
            void actions.onCopy(value);
          }}
          onDelete={actions.deletePreviewItem}
          onClose={() => setActivePreview(null)}
        />
      )}

      {editDialog && (
        <HomeEditDialog
          editDialog={editDialog}
          t={t}
          onClose={() => setEditDialog(null)}
          onChange={(value) => setEditDialog((prev) => (prev ? { ...prev, value } : prev))}
          onSubmit={actions.submitEditDialog}
        />
      )}
    </div>
  );
}
