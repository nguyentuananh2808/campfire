import { TestBed } from '@angular/core/testing';
import { TabNotificationService } from './tab-notification.service';

describe('TabNotificationService', () => {
  beforeEach(() => {
    document.title = 'Campfire';
    TestBed.configureTestingModule({});
  });

  it('tracks group and total unread counts in the browser title', () => {
    const service = TestBed.inject(TabNotificationService);

    service.announce('group:first', 2);
    service.announce('stranger-chat');

    expect(service.groupUnreadCount()).toBe(2);
    expect(service.unreadCount()).toBe(3);
    expect(document.title).toBe('(3) Campfire');
  });

  it('clears one conversation without losing other unread counts', () => {
    const service = TestBed.inject(TabNotificationService);
    service.announce('group:first', 2);
    service.announce('group:second', 3);

    service.clear('group:first');

    expect(service.groupUnreadCount()).toBe(3);
    expect(document.title).toBe('(3) Campfire');
    service.clearGroups();
    expect(document.title).toBe('Campfire');
  });
});
