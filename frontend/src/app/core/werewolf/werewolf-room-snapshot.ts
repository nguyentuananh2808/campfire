import { PrivateRole } from './private-role';
import { WerewolfGameEvent } from './werewolf-game-event';
import { WerewolfPlayer } from './werewolf-player';

export interface WerewolfRoomSnapshot {
  id: string;
  code: string;
  name: string;
  visibility: 'Public' | 'Private';
  status: 'Lobby' | 'InProgress' | 'Finished';
  hostUserId: string;
  minimumPlayers: number;
  maximumPlayers: number;
  deadVoiceEnabled: boolean;
  version: string;
  gameId: string | null;
  phase: string | null;
  round: number;
  phaseSequence: number;
  phaseEndsAtUtc: string | null;
  winner: 'Village' | 'Werewolves' | null;
  players: WerewolfPlayer[];
  myRole: PrivateRole | null;
  events: WerewolfGameEvent[];
  canManage: boolean;
  canStart: boolean;
  canAct: boolean;
  canVote: boolean;
  votesSubmitted: number;
  eligibleVoters: number;
}
