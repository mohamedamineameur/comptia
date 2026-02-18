function parseEmail(input: unknown): string {
  if (typeof input !== 'string') {
    throw new Error('Email is required');
  }
  const email = input.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email');
  }
  return email;
}

function parsePassword(input: unknown): string {
  if (typeof input !== 'string' || input.length < 8) {
    throw new Error('Password must contain at least 8 characters');
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
