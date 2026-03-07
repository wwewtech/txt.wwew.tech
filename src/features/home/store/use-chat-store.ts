import { create } from 'zustand';
import type { ChatMessage, ActiveMode } from '../model/page-types';

interface ChatState {
  prompt: string;
  setPrompt: (prompt: string | ((prev: string) => string)) => void;
  chatMessages: ChatMessage[];
  setChatMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  activeMode: ActiveMode;
  setActiveMode: (mode: ActiveMode) => void;
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
  includePromptInResult: boolean;
  setIncludePromptInResult: (include: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  prompt: '',
  setPrompt: (prompt) => set((state) => ({ prompt: typeof prompt === 'function' ? prompt(state.prompt) : prompt })),
  chatMessages: [],
  setChatMessages: (messages) => set((state) => ({ 
    chatMessages: typeof messages === 'function' ? messages(state.chatMessages) : messages 
  })),
  activeMode: 'chat',
  setActiveMode: (activeMode) => set({ activeMode }),
  currentChatId: null,
  setCurrentChatId: (currentChatId) => set({ currentChatId }),
  includePromptInResult: true,
  setIncludePromptInResult: (includePromptInResult) => set({ includePromptInResult }),
}));

export function resetChatStore() {
  useChatStore.setState({
    prompt: "",
    chatMessages: [],
    activeMode: "chat",
    currentChatId: null,
    includePromptInResult: true,
  });
}
