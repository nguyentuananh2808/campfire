import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageActions } from './message-actions';

describe('MessageActions', () => {
  let fixture: ComponentFixture<MessageActions>;
  let component: MessageActions;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MessageActions] }).compileComponents();
    fixture = TestBed.createComponent(MessageActions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('opens the compact action tray from the trigger', () => {
    const emitted = vi.fn();
    component.openChange.subscribe(emitted);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.action-trigger')
      ?.click();

    expect(emitted).toHaveBeenCalledWith(true);
  });

  it('emits a reaction and closes the tray', () => {
    const reacted = vi.fn();
    const opened = vi.fn();
    component.reactionSelected.subscribe(reacted);
    component.openChange.subscribe(opened);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('.reaction-option')
      ?.click();

    expect(reacted).toHaveBeenCalledWith('Like');
    expect(opened).toHaveBeenCalledWith(false);
  });

  it('uses an icon-only accessible reply action', () => {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    const reply = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.reply-option',
    );

    expect(reply?.getAttribute('aria-label')).toBe('Trả lời tin nhắn');
    expect(reply?.textContent?.trim()).toBe('');
  });

  it('shows an icon-only edit action for own messages', () => {
    const edited = vi.fn();
    component.editRequested.subscribe(edited);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('mine', true);
    fixture.componentRef.setInput('editable', true);
    fixture.detectChanges();

    const edit = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '[aria-label="Sửa tin nhắn"]',
    );
    edit?.click();

    expect(edit?.textContent?.trim()).toBe('');
    expect(edited).toHaveBeenCalledOnce();
  });
});
