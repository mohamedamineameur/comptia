import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';

import { AppError } from '../errors/app-error.js';
import { env } from '../../config/env.js';
import { Session } from '../../db/models/index.js';

async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionId = req.cookies?.[env.auth.cookieName] as string | undefined;
  if (!sessionId) {
    next(new AppError('UNAUTHORIZED', 401));
    return;
  }

  const session = await Session.findOne({
    where: {
      sessionId,
      revokedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    },
    include: [{ association: 'user' }],
  });

  if (!session) {
    next(new AppError('UNAUTHORIZED', 401));
    return;
  }

  req.user = session.user;
  req.sessionId = sessionId;
  next();
}

export { requireAuth };
