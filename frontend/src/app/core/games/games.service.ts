import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { CaroGame } from './caro-game';

@Injectable({ providedIn: 'root' })
export class GamesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/games';

  list(): Observable<CaroGame[]> {
    return this.http.get<CaroGame[]>(this.baseUrl);
  }

  get(gameId: string): Observable<CaroGame> {
    return this.http.get<CaroGame>(`${this.baseUrl}/${gameId}`);
  }

  create(groupId: string, opponentUserId: string): Observable<CaroGame> {
    return this.mutation(() => this.http.post<CaroGame>(this.baseUrl, { groupId, opponentUserId }));
  }

  play(gameId: string, cell: number, expectedVersion: string): Observable<CaroGame> {
    return this.mutation(() =>
      this.http.post<CaroGame>(`${this.baseUrl}/${gameId}/moves`, { cell, expectedVersion }),
    );
  }

  private mutation<T>(request: () => Observable<T>): Observable<T> {
    return this.http.get<void>('/api/v1/auth/antiforgery').pipe(switchMap(request));
  }
}
