import { resetChatStore } from "./use-chat-store";
import { resetFilesStore } from "./use-files-store";
import { resetUIStore } from "./use-ui-store";

export function resetHomeStores() {
  resetChatStore();
  resetFilesStore();
  resetUIStore();
}
