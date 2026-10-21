import { EventParticipant } from './event-participant';
import { EventStatus } from './event-status';
import { RsvpResponse } from './rsvp-response';
import { UnansweredMember } from './unanswered-member';

export interface EventDetail {
  id: string;
  groupId: string;
  creatorUserId: string;
  creatorDisplayName: string;
  title: string;
  description: string;
  startsAtUtc: string;
  location: string;
  status: EventStatus;
  version: string;
  canManage: boolean;
  myResponse: RsvpResponse | null;
  participants: EventParticipant[];
  unansweredMembers: UnansweredMember[];
}
