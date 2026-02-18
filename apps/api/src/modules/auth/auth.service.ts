import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import { AppError } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';
import type { User } from '../../db/models/index.js';
import { AuthRepository } from './auth.repo.js';

type SafeUser = { id: number; email: string; displayName: string | null };

class AuthService {
  constructor(private readonly repo: AuthRepository) {}

  private toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName ?? null,
    };
  }

  async register(input: {
    email: string;
    password: string;
    displayName: string | null;
    ip: string | null;
    userAgent: string | null;
  }): Promise<{ user: SafeUser; sessionId: string; expiresAt: Date }> {
    const existing = await this.repo.findUserByEmail(input.email);
    if (existing) {
      throw new AppError('EMAIL_ALREADY_USED', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.repo.createUser(input.email, passwordHash, input.displayName);

    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + env.auth.sessionTtlHours * 60 * 60 * 1000);
    await this.repo.createSession({
      sessionId,
      userId: user.id,
      expiresAt,
      ip: input.ip,
      userAgent: input.userAgent,
    });

    return { user: this.toSafeUser(user), sessionId, expiresAt };
  }

  async login(input: {
    email: string;
    password: string;
    ip: string | null;
    userAgent: string | null;
  }): Promise<{ user: SafeUser; sessionId: string; expiresAt: Date }> {
    const user = await this.repo.findUserByEmail(input.email);
    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 401);
    }

    const matches = await bcrypt.compare(input.password, user.passwordHash);
    if (!matches) {
      throw new AppError('INVALID_CREDENTIALS', 401);
    }

    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + env.auth.sessionTtlHours * 60 * 60 * 1000);
    await this.repo.createSession({
      sessionId,
      userId: user.id,
      expiresAt,
      ip: input.ip,
      userAgent: input.userAgent,
    });

    return { user: this.toSafeUser(user), sessionId, expiresAt };
  }

  async getCurrentUser(sessionId: string): Promise<SafeUser | null> {
    const session = await this.repo.findActiveSessionWithUser(sessionId);
    if (!session?.user) {
      return null;
    }
    return this.toSafeUser(session.user);
  }

  async logout(sessionId: string): Promise<void> {
    await this.repo.revokeSession(sessionId);
  }
}

export { AuthService };
