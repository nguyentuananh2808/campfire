import { ChatMessage } from './chat-message';
export interface ChatMessagePage {
  items: ChatMessage[];
  olderCursor: string | null;
  latestCursor: string | null;
  hasMore: boolean;
}
