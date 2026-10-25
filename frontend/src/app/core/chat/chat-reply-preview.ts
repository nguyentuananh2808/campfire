import { ChatMessageKind } from './chat-message-kind';

export interface ChatReplyPreview {
  messageId: string;
  senderDisplayName: string;
  kind: ChatMessageKind;
  content: string;
}
