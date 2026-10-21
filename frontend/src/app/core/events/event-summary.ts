import { EventStatus } from './event-status';
import { RsvpResponse } from './rsvp-response';

export interface EventSummary {
  id: string;
  groupId: string;
  creatorUserId: string;
  title: string;
  startsAtUtc: string;
  location: string;
  status: EventStatus;
  version: string;
  goingCount: number;
  notGoingCount: number;
  myResponse: RsvpResponse | null;
}
