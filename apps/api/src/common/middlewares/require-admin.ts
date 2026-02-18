import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/app-error.js';
import { env } from '../../config/env.js';

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new AppError('UNAUTHORIZED', 401));
    return;
  }

  const email = req.user.email.toLowerCase();
  if (!env.admin.emails.includes(email)) {
    next(new AppError('FORBIDDEN', 403));
    return;
  }

  next();
}

export { requireAdmin };
