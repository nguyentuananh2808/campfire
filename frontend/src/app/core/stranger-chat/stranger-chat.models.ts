export type GuestGender = 'Male' | 'Female' | 'Other';
export type GenderPreference = 'Any' | GuestGender;

export interface GuestSession {
  nickname: string;
  gender: GuestGender;
  genderPreference: GenderPreference;
  expiresAtUtc: string;
}
export interface StrangerConversation {
  id: string;
  partnerNickname: string;
  startedAtUtc: string;
  isActive: boolean;
}
export interface MatchmakingResult {
  status: 'waiting' | 'matched';
  conversation: StrangerConversation | null;
}
export interface StrangerMessage {
  id: string;
  conversationId: string;
  clientMessageId: string;
  kind: 'Text' | 'Sticker';
  content: string;
  sentAtUtc: string;
  editedAtUtc: string | null;
  version: string;
  isMine: boolean;
  replyTo: StrangerReplyPreview | null;
  reactions: StrangerReactionSummary[];
  myReaction: StrangerReaction | null;
  state?: 'pending' | 'sent' | 'failed';
}
export type StrangerReaction = 'Like' | 'Love' | 'Laugh' | 'Wow' | 'Sad';
export interface StrangerReactionSummary {
  reaction: StrangerReaction;
  count: number;
}
export interface StrangerReplyPreview {
  messageId: string;
  isMine: boolean;
  kind: 'Text' | 'Sticker';
  content: string;
}
export interface StrangerMessagePage {
  items: StrangerMessage[];
}
