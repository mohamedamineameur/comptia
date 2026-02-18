import type { NextFunction, Request, Response } from 'express';

import { env } from '../../config/env.js';

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const email = req.user.email.toLowerCase();
  if (!env.admin.emails.includes(email)) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }

  next();
}

export { requireAdmin };
