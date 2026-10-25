export type ChatReaction = 'Like' | 'Love' | 'Laugh' | 'Wow' | 'Sad';

export interface ChatReactionSummary {
  reaction: ChatReaction;
  count: number;
}
