type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'BAD_GATEWAY'
  | 'INTERNAL_SERVER_ERROR'
  | 'INVALID_QUERY_PARAM'
  | 'INVALID_BODY'
  | 'INVALID_EMAIL'
  | 'EMAIL_REQUIRED'
  | 'INVALID_PASSWORD'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_USED'
  | 'DAILY_GENERATION_QUOTA_EXCEEDED'
  | 'TOO_MANY_GENERATION_REQUESTS'
  | 'QUESTION_NOT_FOUND'
  | 'SUB_OBJECTIVE_NOT_FOUND'
  | 'INVALID_CHOICE'
  | 'OPENAI_API_KEY_MISSING'
  | 'OPENAI_EMPTY_RESPONSE'
  | 'OPENAI_INVALID_FORMAT'
  | 'OPENAI_API_FAILED'
  | 'ADMIN_INVALID_PAYLOAD';

class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, status: number, details?: Record<string, unknown>) {
    super(code);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export { AppError };
export type { ErrorCode };
