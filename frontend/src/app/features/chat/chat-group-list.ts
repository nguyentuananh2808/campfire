import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ChatGroupConversation } from './chat-group-conversation';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  selector: 'app-chat-group-list',
  templateUrl: './chat-group-list.html',
  styleUrl: './chat-group-list.scss',
})
export class ChatGroupList {
  readonly conversations = input.required<ChatGroupConversation[]>();
  readonly selectedGroupId = input<string | null>(null);
  readonly selected = output<string>();
  readonly closeRequested = output<void>();

  select(groupId: string): void {
    this.selected.emit(groupId);
    this.closeRequested.emit();
  }

  unreadLabel(count: number): string {
    return count > 99 ? '99+' : `${count}`;
  }
}
