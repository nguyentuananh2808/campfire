import { Directive, EventEmitter, HostListener, OnDestroy, Output } from '@angular/core';

@Directive({ selector: '[appLongPress]' })
export class LongPressDirective implements OnDestroy {
  @Output() readonly appLongPress = new EventEmitter<void>();

  private timer: ReturnType<typeof setTimeout> | null = null;
  private startX = 0;
  private startY = 0;

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (!event.isPrimary || event.button !== 0) return;
    this.cancel();
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.appLongPress.emit();
    }, 480);
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(event: PointerEvent): void {
    if (Math.hypot(event.clientX - this.startX, event.clientY - this.startY) > 10) {
      this.cancel();
    }
  }

  @HostListener('pointerup')
  @HostListener('pointercancel')
  @HostListener('pointerleave')
  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy(): void {
    this.cancel();
  }
}
