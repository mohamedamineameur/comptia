import type { CookieOptions, Request, Response } from 'express';

import { env } from '../../config/env.js';
import { AuthService } from './auth.service.js';
import { parseDisplayName, parseEmail, parsePassword } from './auth.validators.js';

class AuthController {
  constructor(private readonly service: AuthService) {}

  private getCookieOptions(expiresAt: Date): CookieOptions {
    return {
      httpOnly: true,
      secure: env.auth.cookieSecure,
      sameSite: env.auth.cookieSameSite,
      path: '/',
      expires: expiresAt,
    };
  }

  register = async (req: Request, res: Response): Promise<void> => {
    const email = parseEmail(req.body?.email);
    const password = parsePassword(req.body?.password);
    const displayName = parseDisplayName(req.body?.displayName);

    const result = await this.service.register({
      email,
      password,
      displayName,
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    res.cookie(env.auth.cookieName, result.sessionId, this.getCookieOptions(result.expiresAt));
    res.status(201).json({ user: result.user });
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const email = parseEmail(req.body?.email);
    const password = parsePassword(req.body?.password);

    const result = await this.service.login({
      email,
      password,
      ip: req.ip ?? null,
      userAgent: req.get('user-agent') ?? null,
    });

    res.cookie(env.auth.cookieName, result.sessionId, this.getCookieOptions(result.expiresAt));
    res.json({ user: result.user });
  };

  me = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        displayName: req.user.displayName ?? null,
      },
    });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const sessionId = req.cookies?.[env.auth.cookieName] as string | undefined;
    if (sessionId) {
      await this.service.logout(sessionId);
    }
    res.clearCookie(env.auth.cookieName, {
      httpOnly: true,
      secure: env.auth.cookieSecure,
      sameSite: env.auth.cookieSameSite,
      path: '/',
    });
    res.status(204).send();
  };
}

export { AuthController };
