"use client";

import { cn } from "@/lib";
import { HomeEditDialog } from "./home-edit-dialog";
import { HomeLeftSidebar } from "./home-left-sidebar";
import { HomeMainPanel } from "./home-main-panel";
import { HomePreviewModal } from "./home-preview-modal";
import { HomeRightSidebar } from "./home-right-sidebar";
import { useHomeActions } from "../hooks/use-home-actions";
import { useHomeState } from "../hooks/use-home-state";

export default function Home() {
  const state = useHomeState();
  const actions = useHomeActions(state);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        style={{ ["--right-sidebar-width" as string]: `${state.rightSidebarWidth}px` }}
        className={cn(
          "grid min-h-screen grid-cols-1",
          state.rightSidebarOpen
            ? state.leftCollapsed
              ? "xl:grid-cols-[minmax(0,1fr)_4px_var(--right-sidebar-width)]"
              : "xl:grid-cols-[280px_minmax(0,1fr)_4px_var(--right-sidebar-width)]"
            : state.leftCollapsed
              ? "xl:grid-cols-[minmax(0,1fr)]"
              : "xl:grid-cols-[280px_minmax(0,1fr)]"
        )}
      >
        {!state.leftCollapsed && (
          <HomeLeftSidebar
            t={state.t}
            language={state.language}
            onLanguageChange={state.setLanguage}
            history={state.history}
            currentChatId={state.currentChatId}
            openHistoryMenuId={state.openHistoryMenuId}
            onCollapseLeft={() => state.setLeftCollapsed(true)}
            onStartNewChat={actions.startNewChat}
            onSelectHistory={actions.selectHistory}
            onToggleHistoryMenu={(id) => state.setOpenHistoryMenuId((prev) => (prev === id ? null : id))}
            onDuplicateHistoryItem={(id) => {
              actions.duplicateHistoryItem(id);
              state.setOpenHistoryMenuId(null);
            }}
            onShareHistoryItem={async (id) => {
              await actions.shareHistoryItem(id);
              state.setOpenHistoryMenuId(null);
            }}
            onRenameHistoryItem={(id) => {
              actions.renameHistoryItem(id);
              state.setOpenHistoryMenuId(null);
            }}
            onCopyHistoryPrompt={actions.copyHistoryPrompt}
            onCopyHistoryFinal={actions.copyHistoryFinal}
            onDeleteHistoryItem={(id) => {
              actions.deleteHistoryItem(id);
              state.setOpenHistoryMenuId(null);
            }}
          />
        )}

        <HomeMainPanel
          t={state.t}
          leftCollapsed={state.leftCollapsed}
          rightSidebarOpen={state.rightSidebarOpen}
          totalTokens={state.totalTokens}
          markdownEnabled={state.markdownEnabled}
          activeMode={state.activeMode}
          timelineEntries={state.timelineEntries}
          prompt={state.prompt}
          isParsing={state.isParsing}
          fileInputRef={state.fileInputRef}
          folderInputRef={state.folderInputRef}
          composerRef={state.composerRef}
          renderMessageBody={state.renderMessageBody}
          bytesToText={state.bytesToText}
          onExpandLeft={() => state.setLeftCollapsed(false)}
          onOpenRight={() => state.setRightSidebarOpen(true)}
          onToggleMarkdown={() => state.setMarkdownEnabled((value) => !value)}
          onChangeActiveMode={state.setActiveMode}
          onDrop={actions.onDrop}
          onPreviewItem={state.setActivePreview}
          onPreviewGroup={actions.previewGroup}
          onCopy={actions.onCopy}
          onToTxtContext={actions.toTxtContext}
          onPushActivity={state.pushActivity}
          l={state.l}
          onTriggerDownload={actions.triggerDownload}
          onEditContextGroup={actions.editContextItems}
          onEditContextItem={actions.editItem}
          onRemoveContextItems={actions.removeContextItems}
          onFilePick={actions.onFilePick}
          onPromptChange={state.setPrompt}
          onSendPrompt={actions.sendPrompt}
          onExportTxt={actions.exportTxt}
        />

        {state.rightSidebarOpen && (
          <>
            <div
              role="separator"
              aria-orientation="vertical"
              className="hidden w-1 shrink-0 cursor-col-resize bg-border/40 transition-colors hover:bg-border xl:block"
              onMouseDown={(event) => {
                event.preventDefault();
                state.setResizingSidebar("right");
              }}
            />
            <HomeRightSidebar
              t={state.t}
              rightSidebarWidth={state.rightSidebarWidth}
              items={state.items}
              processing={state.processing}
              promptSuggestions={state.promptSuggestions}
              bundleFilter={state.bundleFilter}
              sortMode={state.sortMode}
              viewMode={state.viewMode}
              visibleItems={state.visibleItems}
              selectedItems={state.selectedItems}
              skippedFiles={state.skippedFiles}
              selectedItemIds={state.selectedItemIds}
              favoriteItemIds={state.favoriteItemIds}
              totalFiles={state.totalFiles}
              totalBytes={state.totalBytes}
              totalTokens={state.totalTokens}
              activity={state.activity}
              autoSaveEnabled={state.autoSaveEnabled}
              anonymousMode={state.anonymousMode}
              includePromptInResult={state.includePromptInResult}
              showSkippedFiles={state.showSkippedFiles}
              settings={state.settings}
              onCloseRight={() => state.setRightSidebarOpen(false)}
              onSetBundleFilter={state.setBundleFilter}
              onSetSortMode={state.setSortMode}
              onSetViewMode={state.setViewMode}
              onSelectAllVisible={actions.selectAllVisible}
              onBuildSelected={actions.buildSelected}
              onRemoveSelected={actions.removeSelected}
              onAddPromptSuggestion={actions.addPromptSuggestion}
              onQuickBuild={actions.quickBuild}
              onCopyDraft={actions.copyDraft}
              onToggleSelectItem={actions.toggleSelectItem}
              onToggleFavoriteItem={actions.toggleFavoriteItem}
              onPreviewItem={state.setActivePreview}
              onCopyItemTxt={actions.copyItemTxt}
              onCopyItemMd={actions.copyItemMd}
              onDownloadItemTxt={actions.downloadItemTxt}
              onEditItem={actions.editItem}
              onRemoveItem={(item) => actions.removeContextItems([item.id], item.name)}
              onToggleAutoSave={() => state.setAutoSaveEnabled((value) => !value)}
              onToggleAnonymousMode={() => state.setAnonymousMode((value) => !value)}
              onSetIgnoredDirectories={actions.setIgnoredDirectories}
              onSetExcludedExtensions={actions.setExcludedExtensions}
              onSetIncludePromptInResult={state.setIncludePromptInResult}
              onSetShowSkippedFiles={state.setShowSkippedFiles}
              onBytesToText={state.bytesToText}
            />
          </>
        )}
      </div>

      {state.activePreview && (
        <HomePreviewModal
          activePreview={state.activePreview}
          t={state.t}
          renderMessageBody={state.renderMessageBody}
          onCopy={(value) => {
            void actions.onCopy(value);
          }}
          onDelete={actions.deletePreviewItem}
          onClose={() => state.setActivePreview(null)}
        />
      )}

      {state.editDialog && (
        <HomeEditDialog
          editDialog={state.editDialog}
          t={state.t}
          onClose={() => state.setEditDialog(null)}
          onChange={(value) => state.setEditDialog((prev) => (prev ? { ...prev, value } : prev))}
          onSubmit={actions.submitEditDialog}
        />
      )}
    </div>
  );
}
