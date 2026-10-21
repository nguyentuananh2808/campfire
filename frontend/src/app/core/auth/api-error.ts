import { HttpErrorResponse } from '@angular/common/http';
import { ApiProblem } from './api-problem';

export function getApiErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return 'Không thể kết nối. Vui lòng thử lại.';
  }

  const problem = error.error as ApiProblem | null;
  const firstValidationMessage = problem?.errors
    ? Object.values(problem.errors).flat()[0]
    : undefined;
  return (
    firstValidationMessage ??
    problem?.detail ??
    problem?.title ??
    'Yêu cầu không thành công. Vui lòng thử lại.'
  );
}
