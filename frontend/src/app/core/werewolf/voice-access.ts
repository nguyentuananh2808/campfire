export interface VoiceAccess {
  serverUrl: string;
  token: string;
  channel: 'public' | 'wolves' | 'dead';
  expiresAtUtc: string;
  canPublish: boolean;
  canSubscribe: boolean;
}
