export interface ApiProblem {
  title?: string;
  detail?: string;
  code?: string;
  errors?: Record<string, string[]>;
}
