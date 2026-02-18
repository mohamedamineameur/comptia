import { AppError } from '../../common/errors/app-error.js';

type Locale = 'fr' | 'en';

function parseLocale(input: unknown): Locale {
  return input === 'en' ? 'en' : 'fr';
}

function parsePositiveInt(input: unknown, field: string): number {
  const value = Number(input);
  if (!Number.isInteger(value) || value <= 0) {
    throw new AppError('INVALID_BODY', 400, { field });
  }
  return value;
}

function parseDifficulty(input: unknown): number {
  const value = parsePositiveInt(input, 'difficulty');
  if (value < 1 || value > 5) {
    throw new AppError('INVALID_BODY', 400, { field: 'difficulty' });
  }
  return value;
}

function parseCount(input: unknown): number {
  const value = parsePositiveInt(input, 'count');
  if (value > 20) {
    throw new AppError('INVALID_BODY', 400, { field: 'count' });
  }
  return value;
}

export { parseCount, parseDifficulty, parseLocale, parsePositiveInt };
