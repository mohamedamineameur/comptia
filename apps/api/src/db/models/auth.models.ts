import {
  DataTypes,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  type NonAttribute,
} from 'sequelize';

import { sequelize } from '../sequelize.js';

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>;
  declare email: string;
  declare passwordHash: string;
  declare displayName: CreationOptional<string | null>;
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    displayName: { type: DataTypes.STRING(100), allowNull: true },
  },
  { sequelize, tableName: 'users', underscored: true },
);

class Session extends Model<InferAttributes<Session>, InferCreationAttributes<Session>> {
  declare sessionId: string;
  declare userId: number;
  declare expiresAt: Date;
  declare revokedAt: CreationOptional<Date | null>;
  declare ip: CreationOptional<string | null>;
  declare userAgent: CreationOptional<string | null>;
  declare user?: NonAttribute<User>;
}

Session.init(
  {
    sessionId: { type: DataTypes.STRING(128), primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    revokedAt: { type: DataTypes.DATE, allowNull: true },
    ip: { type: DataTypes.STRING(64), allowNull: true },
    userAgent: { type: DataTypes.STRING(512), allowNull: true },
  },
  { sequelize, tableName: 'sessions', underscored: true },
);

User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });
Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { Session, User };
