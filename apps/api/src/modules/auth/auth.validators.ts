import { AppError } from '../../common/errors/app-error.js';

function parseEmail(input: unknown): string {
  if (typeof input !== 'string') {
    throw new AppError('EMAIL_REQUIRED', 400);
  }
  const email = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('INVALID_EMAIL', 400);
  }
  return email;
}

function parsePassword(input: unknown): string {
  if (typeof input !== 'string' || input.length < 8) {
    throw new AppError('INVALID_PASSWORD', 400);
  }
  return input;
}

function parseDisplayName(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null;
  }
  const value = input.trim();
  return value.length > 0 ? value.slice(0, 100) : null;
}

export { parseDisplayName, parseEmail, parsePassword };
