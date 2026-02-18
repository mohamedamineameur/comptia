function getEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] ?? defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

type CookieSameSite = 'lax' | 'strict' | 'none';

function parseCookieSameSite(value: string | undefined): CookieSameSite {
  if (value === 'strict' || value === 'none') {
    return value;
  }
  return 'lax';
}

const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  auth: {
    cookieName: process.env.SESSION_COOKIE_NAME ?? 'sid',
    sessionTtlHours: Number(process.env.SESSION_TTL_HOURS ?? 168),
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    cookieSameSite: parseCookieSameSite(process.env.COOKIE_SAME_SITE),
  },
  qcm: {
    dailyGenerationLimit: Number(process.env.QCM_DAILY_GENERATION_LIMIT ?? 50),
    generateRateWindowMs: Number(process.env.QCM_GENERATE_RATE_WINDOW_MS ?? 60000),
    generateRateMax: Number(process.env.QCM_GENERATE_RATE_MAX ?? 10),
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY ?? '',
    model: process.env.OPENAI_MODEL ?? 'gpt-4.1-mini',
  },
  admin: {
    emails: (process.env.ADMIN_EMAILS ?? '')
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0),
  },
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    name: getEnv('DB_NAME', 'comptia'),
    user: getEnv('DB_USER', 'comptia'),
    password: getEnv('DB_PASSWORD', 'comptia'),
  },
};

export { env };
