import { Op } from 'sequelize';

import { Session, User } from '../../db/models/index.js';

class AuthRepository {
  findUserByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }

  createUser(email: string, passwordHash: string, displayName: string | null): Promise<User> {
    return User.create({ email, passwordHash, displayName });
  }

  createSession(input: {
    sessionId: string;
    userId: number;
    expiresAt: Date;
    ip: string | null;
    userAgent: string | null;
  }): Promise<Session> {
    return Session.create({
      sessionId: input.sessionId,
      userId: input.userId,
      expiresAt: input.expiresAt,
      ip: input.ip,
      userAgent: input.userAgent,
    });
  }

  findActiveSessionWithUser(sessionId: string): Promise<Session | null> {
    return Session.findOne({
      where: {
        sessionId,
        revokedAt: null,
        expiresAt: { [Op.gt]: new Date() },
      },
      include: [{ association: 'user' }],
    });
  }

  revokeSession(sessionId: string): Promise<[count: number]> {
    return Session.update({ revokedAt: new Date() }, { where: { sessionId, revokedAt: null } });
  }
}

export { AuthRepository };
