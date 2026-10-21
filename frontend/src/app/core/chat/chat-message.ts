import { ChatMessageKind } from './chat-message-kind';

export interface ChatMessage {
  id: string;
  groupId: string;
  senderUserId: string;
  senderDisplayName: string;
  clientMessageId: string;
  kind: ChatMessageKind;
  content: string;
  sentAtUtc: string;
}
