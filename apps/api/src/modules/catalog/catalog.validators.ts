type Locale = 'fr' | 'en';

function parseLocale(input: unknown): Locale {
  return input === 'en' ? 'en' : 'fr';
}

function parseRequiredString(input: unknown, field: string): string {
  if (typeof input !== 'string' || input.trim().length === 0) {
    throw new Error(`Missing required query parameter: ${field}`);
  }
  return input.trim();
}

export { parseLocale, parseRequiredString };
