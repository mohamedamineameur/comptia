import type { NextFunction, Request, Response } from 'express';
import { Op } from 'sequelize';

import { env } from '../../config/env.js';
import { Session } from '../../db/models/index.js';

async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessionId = req.cookies?.[env.auth.cookieName] as string | undefined;
  if (!sessionId) {
    res.status(401).json({ message: 'Unauthorized' });
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
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  req.user = session.user;
  req.sessionId = sessionId;
  next();
}

export { requireAuth };
