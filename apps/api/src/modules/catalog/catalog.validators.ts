import { AppError } from '../../common/errors/app-error.js';

type Locale = 'fr' | 'en';

function parseLocale(input: unknown): Locale {
  return input === 'en' ? 'en' : 'fr';
}

function parseRequiredString(input: unknown, field: string): string {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new AppError('INVALID_QUERY_PARAM', 400, { field });
  }
  return input.trim();
}

export { parseLocale, parseRequiredString };
