export interface ChatInboxItem {
  groupId: string;
  lastMessageId: string | null;
  lastMessageSenderDisplayName: string | null;
  lastMessageKind: 'Text' | 'Sticker' | 'Image' | null;
  lastMessagePreview: string | null;
  lastMessageAtUtc: string | null;
  unreadCount: number;
}
