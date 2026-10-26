import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import {
  ExerciseResult,
  LearningCapabilities,
  LearningCompletion,
  LearningDayDetail,
  LearningPath,
  LearningToday,
  VocabularyMindMap,
} from './learning.models';

@Injectable({ providedIn: 'root' })
export class LearningService {
  private readonly http = inject(HttpClient);
  today(): Observable<LearningToday> {
    return this.http.get<LearningToday>('/api/v1/learning/today');
  }
  path(): Observable<LearningPath> {
    return this.http.get<LearningPath>('/api/v1/learning/courses/hsk1/path');
  }
  day(id: string): Observable<LearningDayDetail> {
    return this.http.get<LearningDayDetail>(`/api/v1/learning/days/${id}`);
  }
  capabilities(): Observable<LearningCapabilities> {
    return this.http.get<LearningCapabilities>('/api/v1/learning/capabilities');
  }
  mindMap(word: string): Observable<VocabularyMindMap> {
    return this.http.get<VocabularyMindMap>('/api/v1/learning/vocabulary/mindmap', {
      params: new HttpParams().set('word', word).set('hskLevel', 1).set('maxChildren', 8),
    });
  }
  complete(activityId: string): Observable<LearningCompletion> {
    return this.mutation(() =>
      this.http.post<LearningCompletion>(`/api/v1/learning/activities/${activityId}/complete`, {
        score: 100,
      }),
    );
  }
  submit(
    activityId: string,
    answers: Array<{ questionId: string; value: string }>,
  ): Observable<ExerciseResult> {
    return this.mutation(() =>
      this.http.post<ExerciseResult>(`/api/v1/learning/activities/${activityId}/submit`, {
        answers,
      }),
    );
  }
  private mutation<T>(request: () => Observable<T>): Observable<T> {
    return this.http.get<void>('/api/v1/auth/antiforgery').pipe(switchMap(request));
  }
}
