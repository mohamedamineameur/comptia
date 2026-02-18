import type { NextFunction, Request, Response } from 'express';

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

function rateLimitPerUser(options: { windowMs: number; max: number }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.user ? `u:${req.user.id}` : `ip:${req.ip ?? 'unknown'}`;
    const now = Date.now();
    const existing = store.get(key);

    if (!existing || existing.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (existing.count >= options.max) {
      const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({ message: 'Too many generation requests' });
      return;
    }

    existing.count += 1;
    store.set(key, existing);
    next();
  };
}

export { rateLimitPerUser };
