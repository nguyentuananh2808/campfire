import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ChatGroupConversation } from './chat-group-conversation';
import { ChatGroupList } from './chat-group-list';

describe('ChatGroupList', () => {
  it('renders previews and a bounded unread badge and emits the selected group', async () => {
    await TestBed.configureTestingModule({ imports: [ChatGroupList] }).compileComponents();
    const fixture = TestBed.createComponent(ChatGroupList);
    const conversations: ChatGroupConversation[] = [
      {
        group: {
          id: 'group-1',
          name: 'Hội cuối tuần',
          role: 'Member',
          memberCount: 4,
          version: 'version-1',
        },
        inbox: {
          groupId: 'group-1',
          lastMessageId: 'message-1',
          lastMessageSenderDisplayName: 'An',
          lastMessageKind: 'Text',
          lastMessagePreview: 'Tối nay đi đâu?',
          lastMessageAtUtc: '2026-11-07T12:00:00Z',
          unreadCount: 120,
        },
      },
    ];
    fixture.componentRef.setInput('conversations', conversations);
    fixture.componentRef.setInput('selectedGroupId', 'group-1');
    const selected = vi.fn();
    fixture.componentInstance.selected.subscribe(selected);
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector('.conversation-item') as HTMLButtonElement;
    expect(item.textContent).toContain('Hội cuối tuần');
    expect(item.textContent).toContain('Tối nay đi đâu?');
    expect(item.textContent).toContain('99+');
    expect(item.getAttribute('aria-current')).toBe('page');

    item.click();
    expect(selected).toHaveBeenCalledWith('group-1');
  });
});
