import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { getApiErrorMessage } from '../../core/auth/api-error';
import { AuthStore } from '../../core/auth/auth.store';
import {
  WerewolfRealtimeService,
  WerewolfRealtimeState,
} from '../../core/werewolf/werewolf-realtime.service';
import { WerewolfRoomInput, WerewolfService } from '../../core/werewolf/werewolf.service';
import { WerewolfRoomSnapshot } from '../../core/werewolf/werewolf-room-snapshot';
import { WerewolfRoomSummary } from '../../core/werewolf/werewolf-room-summary';
import { WerewolfVoiceService } from '../../core/werewolf/werewolf-voice.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ReactiveFormsModule],
  selector: 'app-werewolf-page',
  templateUrl: './werewolf-page.html',
  styleUrl: './werewolf-page.scss',
})
export class WerewolfPage {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(WerewolfService);
  private readonly realtime = inject(WerewolfRealtimeService);
  readonly auth = inject(AuthStore);
  readonly voice = inject(WerewolfVoiceService);
  readonly rooms = signal<WerewolfRoomSummary[]>([]);
  readonly room = signal<WerewolfRoomSnapshot | null>(null);
  readonly loading = signal(true);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly realtimeState = signal<WerewolfRealtimeState>('disconnected');
  readonly secondsLeft = signal(0);
  readonly targetUserId = signal<string | null>(null);
  readonly microphones = signal<MediaDeviceInfo[]>([]);
  readonly speakers = signal<MediaDeviceInfo[]>([]);
  readonly currentPlayer = computed(() =>
    this.room()?.players.find((player) => player.userId === this.auth.user()?.id),
  );
  readonly aliveTargets = computed(
    () =>
      this.room()?.players.filter(
        (player) =>
          player.kind === 'Player' && player.isAlive && player.userId !== this.auth.user()?.id,
      ) ?? [],
  );
  readonly createForm = this.formBuilder.nonNullable.group({
    name: [
      'Đêm bên lửa trại',
      [Validators.required, Validators.maxLength(80), Validators.pattern(/\S/)],
    ],
    visibility: ['Public' as const, Validators.required],
    minimumPlayers: [6, [Validators.min(6), Validators.max(20)]],
    maximumPlayers: [12, [Validators.min(6), Validators.max(20)]],
    deadVoiceEnabled: [true],
  });
  readonly joinForm = this.formBuilder.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{8}$/)]],
    spectator: [false],
  });
  readonly settingsForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    visibility: ['Public' as 'Public' | 'Private'],
    minimumPlayers: [6, [Validators.min(6), Validators.max(20)]],
    maximumPlayers: [12, [Validators.min(6), Validators.max(20)]],
    deadVoiceEnabled: [true],
  });
  private connectedRoomId?: string;
  private timerId?: number;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const roomId = params.get('roomId');
      const code = params.get('code');
      if (roomId) this.loadRoom(roomId);
      else if (code) {
        this.joinForm.patchValue({ code });
        this.join();
      } else this.loadRooms();
    });
    this.timerId = window.setInterval(() => this.updateCountdown(), 1000);
    this.destroyRef.onDestroy(() => {
      if (this.timerId) window.clearInterval(this.timerId);
      void this.realtime.stop();
    });
  }

  create(): void {
    if (this.createForm.invalid || this.pending()) return;
    this.run(this.api.create(this.createForm.getRawValue()), (room) => this.open(room.id));
  }
  join(): void {
    if (this.joinForm.invalid || this.pending()) return;
    const value = this.joinForm.getRawValue();
    this.run(this.api.join(value.code, value.spectator), (room) => this.open(room.id));
  }
  open(roomId: string): void {
    void this.router.navigate(['/werewolf', roomId]);
  }
  retry(): void {
    const room = this.room();
    room ? this.loadRoom(room.id) : this.loadRooms();
  }
  setReady(): void {
    const room = this.room();
    const me = this.currentPlayer();
    if (room && me) this.run(this.api.ready(room.id, !me.isReady), (value) => this.apply(value));
  }
  start(): void {
    const room = this.room();
    if (room) this.run(this.api.start(room.id, room.version), (value) => this.apply(value));
  }
  saveSettings(): void {
    const room = this.room();
    if (!room || this.settingsForm.invalid) return;
    this.run(this.api.update(room.id, this.settingsForm.getRawValue(), room.version), (value) =>
      this.apply(value),
    );
  }
  leave(): void {
    const room = this.room();
    if (!room) return;
    this.run(this.api.leave(room.id), () => {
      void this.voice.disconnect();
      void this.router.navigate(['/werewolf']);
    });
  }
  moderate(userId: string, action: 'mute' | 'unmute' | 'kick'): void {
    const room = this.room();
    if (room) this.run(this.api.moderate(room.id, userId, action), (value) => this.apply(value));
  }
  selectTarget(userId: string): void {
    this.targetUserId.set(userId);
  }
  submitAction(kind?: string): void {
    const room = this.room();
    if (!room?.gameId) return;
    const action = kind ?? this.actionKind(room);
    const target = action === 'WitchPass' ? null : this.targetUserId();
    if (!action || (action !== 'WitchPass' && !target)) return;
    this.run(this.api.action(room.gameId, action, target), (value) => {
      this.targetUserId.set(null);
      this.apply(value);
    });
  }
  vote(blank = false): void {
    const room = this.room();
    if (!room?.gameId || (!blank && !this.targetUserId())) return;
    this.run(this.api.vote(room.gameId, blank ? null : this.targetUserId()), (value) => {
      this.targetUserId.set(null);
      this.apply(value);
    });
  }
  connectVoice(): void {
    const room = this.room();
    if (!room || this.pending()) return;
    this.pending.set(true);
    this.error.set(null);
    this.api
      .voice(room.id)
      .pipe(
        finalize(() => this.pending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (access) =>
          void this.voice
            .connect(access)
            .then(() => this.loadDevices())
            .catch(() =>
              this.error.set('Không thể kết nối voice. Kiểm tra LiveKit và quyền microphone.'),
            ),
        error: (error) => this.error.set(getApiErrorMessage(error)),
      });
  }
  copyInvite(): void {
    const room = this.room();
    if (room) void navigator.clipboard.writeText(`${location.origin}/werewolf/join/${room.code}`);
  }
  selectMicrophone(event: Event): void {
    void this.voice.selectMicrophone((event.target as HTMLSelectElement).value);
  }
  selectSpeaker(event: Event): void {
    void this.voice.selectSpeaker((event.target as HTMLSelectElement).value);
  }
  setVolume(userId: string, event: Event): void {
    this.voice.setVolume(userId, Number((event.target as HTMLInputElement).value) / 100);
  }
  phaseLabel(phase: string | null): string {
    return (
      (
        {
          NightWerewolves: 'Đêm — Ma Sói',
          NightSeer: 'Đêm — Tiên tri',
          NightGuard: 'Đêm — Bảo vệ',
          NightWitch: 'Đêm — Phù thủy',
          DayDiscussion: 'Ban ngày — Thảo luận',
          DayVoting: 'Ban ngày — Bỏ phiếu',
          Finished: 'Kết thúc',
        } as Record<string, string>
      )[phase ?? ''] ?? 'Phòng chờ'
    );
  }
  actionKind(room: WerewolfRoomSnapshot): string | null {
    return (
      (
        {
          NightWerewolves: 'WerewolfTarget',
          NightSeer: 'Investigate',
          NightGuard: 'Protect',
        } as Record<string, string>
      )[room.phase ?? ''] ?? (room.phase === 'NightWitch' ? 'WitchPoison' : null)
    );
  }

  private loadRooms(): void {
    this.loading.set(true);
    this.error.set(null);
    this.room.set(null);
    void this.realtime.stop();
    this.connectedRoomId = undefined;
    this.api
      .list()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (rooms) => this.rooms.set(rooms),
        error: (error) => this.error.set(getApiErrorMessage(error)),
      });
  }
  private loadRoom(roomId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .get(roomId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (room) => {
          this.apply(room);
          void this.ensureRealtime(roomId);
        },
        error: (error) => this.error.set(getApiErrorMessage(error)),
      });
  }
  private apply(room: WerewolfRoomSnapshot): void {
    this.room.set(room);
    this.settingsForm.setValue({
      name: room.name,
      visibility: room.visibility,
      minimumPlayers: room.minimumPlayers,
      maximumPlayers: room.maximumPlayers,
      deadVoiceEnabled: room.deadVoiceEnabled,
    });
    this.updateCountdown();
  }
  private async ensureRealtime(roomId: string): Promise<void> {
    if (this.connectedRoomId === roomId) return;
    this.connectedRoomId = roomId;
    try {
      await this.realtime.connect(
        roomId,
        () => this.refreshQuietly(roomId),
        () => {
          const reconnectVoice = this.voice.state() !== 'disconnected';
          void this.voice.disconnect();
          this.refreshQuietly(roomId, reconnectVoice);
        },
        (state) => this.realtimeState.set(state),
      );
    } catch {
      this.realtimeState.set('disconnected');
      this.error.set('Mất kết nối realtime. Bạn vẫn có thể tải lại trạng thái từ server.');
    }
  }
  private refreshQuietly(roomId: string, reconnectVoice = false): void {
    this.api
      .get(roomId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (room) => {
          this.apply(room);
          if (reconnectVoice && this.canHaveVoice(room)) this.connectVoice();
        },
        error: () => this.realtimeState.set('disconnected'),
      });
  }
  private canHaveVoice(room: WerewolfRoomSnapshot): boolean {
    const me = room.players.find((player) => player.userId === this.auth.user()?.id);
    if (!me) return false;
    if (room.status !== 'InProgress') return true;
    if (!me.isAlive) return room.deadVoiceEnabled;
    if (room.phase === 'NightWerewolves') return room.myRole?.id === 'Werewolf';
    return room.phase === 'DayDiscussion' || room.phase === 'DayVoting';
  }
  private loadDevices(): void {
    void navigator.mediaDevices?.enumerateDevices().then((devices) => {
      this.microphones.set(devices.filter((device) => device.kind === 'audioinput'));
      this.speakers.set(devices.filter((device) => device.kind === 'audiooutput'));
    });
  }
  private updateCountdown(): void {
    const end = this.room()?.phaseEndsAtUtc;
    this.secondsLeft.set(
      end ? Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 1000)) : 0,
    );
  }
  private run<T>(request: import('rxjs').Observable<T>, success: (value: T) => void): void {
    if (this.pending()) return;
    this.pending.set(true);
    this.error.set(null);
    request
      .pipe(
        finalize(() => this.pending.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: success,
        error: (error: unknown) => {
          this.error.set(getApiErrorMessage(error));
          if (error instanceof HttpErrorResponse && error.status === 409) {
            const room = this.room();
            if (room) this.refreshQuietly(room.id);
          }
        },
      });
  }
}
