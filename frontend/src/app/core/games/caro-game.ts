export interface CaroGame {
  id: string;
  groupId: string;
  xPlayerUserId: string;
  xPlayerDisplayName: string;
  oPlayerUserId: string;
  oPlayerDisplayName: string;
  currentPlayerUserId: string;
  winnerUserId: string | null;
  board: string;
  status: 'Active' | 'Won' | 'Draw';
  version: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}
