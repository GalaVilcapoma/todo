export interface ApiErrorResponse {
  message?: string;
  error?: string;
}

export interface MutationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
