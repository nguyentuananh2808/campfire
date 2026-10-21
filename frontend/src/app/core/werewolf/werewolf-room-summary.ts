export interface WerewolfRoomSummary {
  id: string;
  code: string;
  name: string;
  visibility: 'Public' | 'Private';
  status: 'Lobby' | 'InProgress' | 'Finished';
  playerCount: number;
  maximumPlayers: number;
  createdAtUtc: string;
}
