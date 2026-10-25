import { ChatMessageKind } from './chat-message-kind';
import { ChatReaction, ChatReactionSummary } from './chat-reaction-summary';
import { ChatReplyPreview } from './chat-reply-preview';

export interface ChatMessage {
  id: string;
  groupId: string;
  senderUserId: string;
  senderDisplayName: string;
  clientMessageId: string;
  kind: ChatMessageKind;
  content: string;
  sentAtUtc: string;
  replyTo: ChatReplyPreview | null;
  reactions: ChatReactionSummary[];
  myReaction: ChatReaction | null;
}
