type Locale = 'fr' | 'en';

function parseLocale(input: unknown): Locale {
  return input === 'en' ? 'en' : 'fr';
}

function parsePositiveInt(input: unknown, field: string): number {
  const value = Number(input);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function parseDifficulty(input: unknown): number {
  const value = parsePositiveInt(input, 'difficulty');
  if (value < 1 || value > 5) {
    throw new Error('Invalid difficulty');
  }
  return value;
}

function parseCount(input: unknown): number {
  const value = parsePositiveInt(input, 'count');
  if (value > 20) {
    throw new Error('Invalid count');
  }
  return value;
}

export { parseCount, parseDifficulty, parseLocale, parsePositiveInt };
