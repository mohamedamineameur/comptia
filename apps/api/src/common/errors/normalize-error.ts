import { AppError } from './app-error.js';

function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const rawMessage = error instanceof Error ? error.message : '';
  switch (rawMessage) {
    case 'Unauthorized':
      return new AppError('UNAUTHORIZED', 401);
    case 'Forbidden':
      return new AppError('FORBIDDEN', 403);
    case 'Invalid credentials':
      return new AppError('INVALID_CREDENTIALS', 401);
    case 'Email already used':
      return new AppError('EMAIL_ALREADY_USED', 409);
    case 'Question not found':
      return new AppError('QUESTION_NOT_FOUND', 404);
    case 'Sub-objective not found':
      return new AppError('SUB_OBJECTIVE_NOT_FOUND', 404);
    case 'Invalid choice':
      return new AppError('INVALID_CHOICE', 400);
    case 'Daily generation quota exceeded':
      return new AppError('DAILY_GENERATION_QUOTA_EXCEEDED', 429);
    case 'Too many generation requests':
      return new AppError('TOO_MANY_GENERATION_REQUESTS', 429);
    case 'Invalid email':
      return new AppError('INVALID_EMAIL', 400);
    case 'Email is required':
      return new AppError('EMAIL_REQUIRED', 400);
    default:
      break;
  }

  if (rawMessage.startsWith('Missing required query parameter')) {
    return new AppError('INVALID_QUERY_PARAM', 400);
  }
  if (rawMessage.startsWith('Password must contain')) {
    return new AppError('INVALID_PASSWORD', 400);
  }
  if (rawMessage.startsWith('Invalid ')) {
    return new AppError('INVALID_BODY', 400);
  }
  if (rawMessage.startsWith('OpenAI')) {
    return new AppError('OPENAI_API_FAILED', 502);
  }

  return new AppError('INTERNAL_SERVER_ERROR', 500);
}

export { normalizeError };
