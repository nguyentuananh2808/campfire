export interface WerewolfPlayer {
  userId: string;
  displayName: string;
  seat: number;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  isAlive: boolean;
  isSpeaking: boolean;
  isHostMuted: boolean;
  kind: 'Player' | 'Spectator';
}
