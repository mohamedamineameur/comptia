import {
  DataTypes,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
} from 'sequelize';

import { sequelize } from '../sequelize.js';
import { SubObjective } from './catalog.models.js';
import { User } from './auth.models.js';

class Question extends Model<InferAttributes<Question>, InferCreationAttributes<Question>> {
  declare id: CreationOptional<number>;
  declare subObjectiveId: number;
  declare language: string;
  declare questionText: string;
  declare explanation: string;
  declare difficulty: number;
  declare source: string;
}

Question.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    subObjectiveId: { type: DataTypes.INTEGER, allowNull: false },
    language: { type: DataTypes.STRING(8), allowNull: false },
    questionText: { type: DataTypes.TEXT, allowNull: false },
    explanation: { type: DataTypes.TEXT, allowNull: false },
    difficulty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
    source: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'generated' },
  },
  { sequelize, tableName: 'questions', underscored: true },
);

class QuestionChoice extends Model<InferAttributes<QuestionChoice>, InferCreationAttributes<QuestionChoice>> {
  declare id: CreationOptional<number>;
  declare questionId: number;
  declare choiceText: string;
  declare isCorrect: boolean;
}

QuestionChoice.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    questionId: { type: DataTypes.INTEGER, allowNull: false },
    choiceText: { type: DataTypes.TEXT, allowNull: false },
    isCorrect: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  },
  { sequelize, tableName: 'question_choices', underscored: true },
);

class GenerationRun extends Model<
  InferAttributes<GenerationRun, { omit: 'createdAt' | 'updatedAt' }>,
  InferCreationAttributes<GenerationRun, { omit: 'createdAt' | 'updatedAt' }>
> {
  declare id: CreationOptional<number>;
  declare subObjectiveId: number;
  declare language: string;
  declare model: string;
  declare promptVersion: string;
  declare status: string;
  declare costTokens: CreationOptional<number | null>;
  declare createdByUserId: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

GenerationRun.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    subObjectiveId: { type: DataTypes.INTEGER, allowNull: false },
    language: { type: DataTypes.STRING(8), allowNull: false },
    model: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'template-v1' },
    promptVersion: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'v1' },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'completed' },
    costTokens: { type: DataTypes.INTEGER, allowNull: true },
    createdByUserId: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: 'generation_runs', underscored: true },
);

class UserAnswer extends Model<InferAttributes<UserAnswer>, InferCreationAttributes<UserAnswer>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare questionId: number;
  declare selectedChoiceId: number;
  declare isCorrect: boolean;
  declare answeredAt: CreationOptional<Date>;
  declare timeSpentMs: CreationOptional<number | null>;
}

UserAnswer.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    questionId: { type: DataTypes.INTEGER, allowNull: false },
    selectedChoiceId: { type: DataTypes.INTEGER, allowNull: false },
    isCorrect: { type: DataTypes.BOOLEAN, allowNull: false },
    answeredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    timeSpentMs: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, tableName: 'user_answers', underscored: true },
);

class UserMastery extends Model<InferAttributes<UserMastery>, InferCreationAttributes<UserMastery>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare subObjectiveId: number;
  declare masteryScore: number;
  declare lastActivityAt: Date;
  declare streak: CreationOptional<number>;
}

UserMastery.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    subObjectiveId: { type: DataTypes.INTEGER, allowNull: false },
    masteryScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    lastActivityAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    streak: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: 'user_mastery',
    underscored: true,
    indexes: [{ unique: true, fields: ['user_id', 'sub_objective_id'] }],
  },
);

SubObjective.hasMany(Question, { foreignKey: 'subObjectiveId', as: 'questions' });
Question.belongsTo(SubObjective, { foreignKey: 'subObjectiveId', as: 'subObjective' });

Question.hasMany(QuestionChoice, { foreignKey: 'questionId', as: 'choices' });
QuestionChoice.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

SubObjective.hasMany(GenerationRun, { foreignKey: 'subObjectiveId', as: 'generationRuns' });
GenerationRun.belongsTo(SubObjective, { foreignKey: 'subObjectiveId', as: 'subObjective' });
User.hasMany(GenerationRun, { foreignKey: 'createdByUserId', as: 'generationRuns' });
GenerationRun.belongsTo(User, { foreignKey: 'createdByUserId', as: 'createdBy' });

User.hasMany(UserAnswer, { foreignKey: 'userId', as: 'answers' });
UserAnswer.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Question.hasMany(UserAnswer, { foreignKey: 'questionId', as: 'answers' });
UserAnswer.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });
QuestionChoice.hasMany(UserAnswer, { foreignKey: 'selectedChoiceId', as: 'selectedAnswers' });
UserAnswer.belongsTo(QuestionChoice, { foreignKey: 'selectedChoiceId', as: 'selectedChoice' });

User.hasMany(UserMastery, { foreignKey: 'userId', as: 'masteryEntries' });
UserMastery.belongsTo(User, { foreignKey: 'userId', as: 'user' });
SubObjective.hasMany(UserMastery, { foreignKey: 'subObjectiveId', as: 'masteryEntries' });
UserMastery.belongsTo(SubObjective, { foreignKey: 'subObjectiveId', as: 'subObjective' });

export { GenerationRun, Question, QuestionChoice, UserAnswer, UserMastery };
