import type { ParsedItem } from "@/lib";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type HistoryItem = {
  id: string;
  title: string;
  updatedAt: string;
  tokenEstimate: number;
  finalText: string;
  prompt: string;
  items: ParsedItem[];
  chatMessages: ChatMessage[];
};

export type ActivityStatus = "success" | "error" | "warning" | "pending" | "info";

export type ActivityItem = {
  id: string;
  label: string;
  at: string;
  status?: ActivityStatus;
  error?: string;
};

export type ContextGroup = {
  id: string;
  label: string;
  path: string;
  kind: "file" | "folder" | "archive";
  createdAt: string;
  fileCount: number;
  folderCount: number;
  tokenEstimate: number;
  size: number;
  items: ParsedItem[];
};

export type EditDialogState =
  | {
      mode: "context-group";
      value: string;
      group: ContextGroup;
    }
  | {
      mode: "context-item";
      value: string;
      item: ParsedItem;
    }
  | {
      mode: "history-rename";
      value: string;
      historyId: string;
    };

export type SortMode = "latest" | "name" | "tokens" | "size";
export type ViewMode = "cards" | "compact";
export type Language = "ru" | "en";
export type ActiveMode = "chat" | "stream" | "realtime";
export type FontSizeScope = "center" | "all";

export type TimelineEntry =
  | {
      id: string;
      type: "message";
      createdAt: string;
      message: ChatMessage;
      index: number;
      timestamp: number;
    }
  | {
      id: string;
      type: "context";
      createdAt: string;
      group: ContextGroup;
      index: number;
      timestamp: number;
    };
