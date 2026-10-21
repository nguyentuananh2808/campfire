import { RsvpResponse } from './rsvp-response';

export interface EventParticipant {
  userId: string;
  displayName: string;
  response: RsvpResponse;
  respondedAtUtc: string;
  isCurrentMember: boolean;
}
