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
  content: string;
  sentAtUtc: string;
  isMine: boolean;
  state?: 'pending' | 'sent' | 'failed';
}
export interface StrangerMessagePage {
  items: StrangerMessage[];
}
