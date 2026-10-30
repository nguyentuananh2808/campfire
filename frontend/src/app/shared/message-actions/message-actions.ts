import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MessageActionReaction } from './message-action-reaction';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-message-actions',
  templateUrl: './message-actions.html',
  styleUrl: './message-actions.scss',
})
export class MessageActions {
  readonly open = input(false);
  readonly mine = input(false);
  readonly editable = input(false);
  readonly selectedReaction = input<MessageActionReaction | null>(null);

  readonly openChange = output<boolean>();
  readonly replyRequested = output<void>();
  readonly editRequested = output<void>();
  readonly reactionSelected = output<MessageActionReaction>();

  readonly reactions: ReadonlyArray<{
    code: MessageActionReaction;
    emoji: string;
    label: string;
  }> = [
    { code: 'Like', emoji: '👍', label: 'Thích' },
    { code: 'Love', emoji: '❤️', label: 'Yêu thích' },
    { code: 'Laugh', emoji: '😂', label: 'Haha' },
    { code: 'Wow', emoji: '😮', label: 'Bất ngờ' },
    { code: 'Sad', emoji: '😢', label: 'Buồn' },
  ];

  toggle(): void {
    this.openChange.emit(!this.open());
  }

  reply(): void {
    this.replyRequested.emit();
    this.openChange.emit(false);
  }

  edit(): void {
    this.editRequested.emit();
    this.openChange.emit(false);
  }

  react(reaction: MessageActionReaction): void {
    this.reactionSelected.emit(reaction);
    this.openChange.emit(false);
  }
}
