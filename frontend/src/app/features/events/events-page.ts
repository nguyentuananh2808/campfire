import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../core/auth/api-error';
import { ApiProblem } from '../../core/auth/api-problem';
import { EventDetail } from '../../core/events/event-detail';
import { EventStatus } from '../../core/events/event-status';
import { EventSummary } from '../../core/events/event-summary';
import { EventsService } from '../../core/events/events.service';
import { RsvpResponse } from '../../core/events/rsvp-response';
import { GroupSummary } from '../../core/groups/group-summary';
import { GroupsService } from '../../core/groups/groups.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule, RouterLink],
  selector: 'app-events-page',
  templateUrl: './events-page.html',
  styleUrl: './events-page.scss',
})
export class EventsPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly groupsService = inject(GroupsService);
  private readonly eventsService = inject(EventsService);
  readonly groups = signal<GroupSummary[]>([]);
  readonly selectedGroup = signal<GroupSummary | null>(null);
  readonly events = signal<EventSummary[]>([]);
  readonly selectedEvent = signal<EventDetail | null>(null);
  readonly loading = signal(true);
  readonly detailLoading = signal(false);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly conflict = signal(false);
  readonly showCreate = signal(false);
  readonly showEdit = signal(false);
  readonly minimumDateTime = this.toLocalInput(new Date(Date.now() + 60_000).toISOString());
  readonly createForm = this.createDetailsForm();
  readonly editForm = this.createDetailsForm();

  constructor() {
    this.loadGroups();
  }

  selectGroup(groupId: string): void {
    const group = this.groups().find((candidate) => candidate.id === groupId);
    if (!group || group.id === this.selectedGroup()?.id) return;
    this.selectedGroup.set(group);
    this.selectedEvent.set(null);
    this.loadEvents(group.id);
  }

  openEvent(eventId: string): void {
    const group = this.selectedGroup();
    if (!group) return;
    this.detailLoading.set(true);
    this.error.set(null);
    this.eventsService
      .get(group.id, eventId)
      .pipe(
        finalize(() => this.detailLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (event) => this.applyDetail(event),
        error: (error) => this.handleError(error),
      });
  }

  create(): void {
    this.createForm.markAllAsTouched();
    const group = this.selectedGroup();
    if (!group || this.createForm.invalid || this.pending()) return;
    this.pending.set(true);
    this.eventsService
      .create(group.id, this.formValue(this.createForm))
      .pipe(
        finalize(() => this.pending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (event) => {
          this.createForm.reset({ title: '', description: '', startsAtLocal: '', location: '' });
          this.showCreate.set(false);
          this.applyDetail(event);
          this.loadEvents(group.id, false);
        },
        error: (error) => this.handleError(error),
      });
  }

  beginEdit(): void {
    const event = this.selectedEvent();
    if (!event) return;
    this.editForm.setValue({
      title: event.title,
      description: event.description,
      startsAtLocal: this.toLocalInput(event.startsAtUtc),
      location: event.location,
    });
    this.showEdit.set(true);
  }

  saveEdit(): void {
    this.editForm.markAllAsTouched();
    const group = this.selectedGroup();
    const event = this.selectedEvent();
    if (!group || !event || this.editForm.invalid || this.pending()) return;
    this.pending.set(true);
    this.eventsService
      .update(group.id, event.id, this.formValue(this.editForm), event.version)
      .pipe(
        finalize(() => this.pending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.showEdit.set(false);
          this.applyDetail(updated);
          this.loadEvents(group.id, false);
        },
        error: (error) => this.handleError(error),
      });
  }

  changeStatus(status: Exclude<EventStatus, 'Open'>): void {
    const group = this.selectedGroup();
    const event = this.selectedEvent();
    if (!group || !event || this.pending()) return;
    this.pending.set(true);
    this.eventsService
      .changeStatus(group.id, event.id, status, event.version)
      .pipe(
        finalize(() => this.pending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.applyDetail(updated);
          this.loadEvents(group.id, false);
        },
        error: (error) => this.handleError(error),
      });
  }

  setRsvp(response: RsvpResponse): void {
    const group = this.selectedGroup();
    const event = this.selectedEvent();
    if (!group || !event || event.status !== 'Open' || this.pending()) return;
    this.pending.set(true);
    this.eventsService
      .setRsvp(group.id, event.id, response)
      .pipe(
        finalize(() => this.pending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (updated) => {
          this.applyDetail(updated);
          this.loadEvents(group.id, false);
        },
        error: (error) => this.handleError(error),
      });
  }

  reloadSelected(): void {
    const event = this.selectedEvent();
    this.conflict.set(false);
    if (event) this.openEvent(event.id);
  }

  private createDetailsForm() {
    return this.formBuilder.nonNullable.group({
      title: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(/\S/)]],
      description: ['', [Validators.maxLength(2000)]],
      startsAtLocal: ['', [Validators.required]],
      location: ['', [Validators.required, Validators.maxLength(200), Validators.pattern(/\S/)]],
    });
  }

  private loadGroups(): void {
    this.groupsService
      .getMine()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (groups) => {
          this.groups.set(groups);
          if (groups[0]) {
            this.selectedGroup.set(groups[0]);
            this.loadEvents(groups[0].id);
          } else this.loading.set(false);
        },
        error: (error) => {
          this.handleError(error);
          this.loading.set(false);
        },
      });
  }

  private loadEvents(groupId: string, showLoading = true): void {
    if (showLoading) this.loading.set(true);
    this.error.set(null);
    this.eventsService
      .list(groupId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (events) => this.events.set(events),
        error: (error) => this.handleError(error),
      });
  }

  private applyDetail(event: EventDetail): void {
    this.selectedEvent.set(event);
    this.conflict.set(false);
    this.error.set(null);
  }

  private formValue(form: typeof this.createForm) {
    const value = form.getRawValue();
    return {
      title: value.title,
      description: value.description,
      startsAtUtc: new Date(value.startsAtLocal).toISOString(),
      location: value.location,
    };
  }

  private handleError(error: unknown): void {
    const problem = error instanceof HttpErrorResponse ? (error.error as ApiProblem | null) : null;
    this.conflict.set(
      error instanceof HttpErrorResponse &&
        error.status === 409 &&
        problem?.code === 'event_concurrency_conflict',
    );
    this.error.set(getApiErrorMessage(error));
  }

  private toLocalInput(iso: string): string {
    const date = new Date(iso);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  }
}
