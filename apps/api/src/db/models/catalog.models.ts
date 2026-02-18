import {
  DataTypes,
  type CreationOptional,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
} from 'sequelize';

import { sequelize } from '../sequelize.js';

class Exam extends Model<InferAttributes<Exam>, InferCreationAttributes<Exam>> {
  declare id: CreationOptional<number>;
  declare code: string;
  declare title: string;
}

Exam.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
  },
  { sequelize, tableName: 'exams', underscored: true },
);

class Domain extends Model<InferAttributes<Domain>, InferCreationAttributes<Domain>> {
  declare id: CreationOptional<number>;
  declare examId: number;
  declare code: string;
  declare nameEn: CreationOptional<string | null>;
  declare nameFr: CreationOptional<string | null>;
}

Domain.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    examId: { type: DataTypes.INTEGER, allowNull: false },
    code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    nameEn: { type: DataTypes.STRING(255), allowNull: true },
    nameFr: { type: DataTypes.STRING(255), allowNull: true },
  },
  { sequelize, tableName: 'domains', underscored: true },
);

class DomainTranslation extends Model<
  InferAttributes<DomainTranslation>,
  InferCreationAttributes<DomainTranslation>
> {
  declare id: CreationOptional<number>;
  declare domainId: number;
  declare locale: string;
  declare name: string;
}

DomainTranslation.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    domainId: { type: DataTypes.INTEGER, allowNull: false },
    locale: { type: DataTypes.STRING(8), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
  },
  { sequelize, tableName: 'domain_translations', underscored: true },
);

class Objective extends Model<InferAttributes<Objective>, InferCreationAttributes<Objective>> {
  declare id: CreationOptional<number>;
  declare domainId: number;
  declare code: string;
  declare titleEn: CreationOptional<string | null>;
  declare titleFr: CreationOptional<string | null>;
}

Objective.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    domainId: { type: DataTypes.INTEGER, allowNull: false },
    code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    titleEn: { type: DataTypes.STRING(255), allowNull: true },
    titleFr: { type: DataTypes.STRING(255), allowNull: true },
  },
  { sequelize, tableName: 'objectives', underscored: true },
);

class ObjectiveTranslation extends Model<
  InferAttributes<ObjectiveTranslation>,
  InferCreationAttributes<ObjectiveTranslation>
> {
  declare id: CreationOptional<number>;
  declare objectiveId: number;
  declare locale: string;
  declare title: string;
}

ObjectiveTranslation.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    objectiveId: { type: DataTypes.INTEGER, allowNull: false },
    locale: { type: DataTypes.STRING(8), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
  },
  { sequelize, tableName: 'objective_translations', underscored: true },
);

class SubObjective extends Model<
  InferAttributes<SubObjective>,
  InferCreationAttributes<SubObjective>
> {
  declare id: CreationOptional<number>;
  declare objectiveId: number;
  declare code: string;
  declare titleEn: CreationOptional<string | null>;
  declare titleFr: CreationOptional<string | null>;
}

SubObjective.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    objectiveId: { type: DataTypes.INTEGER, allowNull: false },
    code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    titleEn: { type: DataTypes.STRING(255), allowNull: true },
    titleFr: { type: DataTypes.STRING(255), allowNull: true },
  },
  { sequelize, tableName: 'sub_objectives', underscored: true },
);

class SubObjectiveTranslation extends Model<
  InferAttributes<SubObjectiveTranslation>,
  InferCreationAttributes<SubObjectiveTranslation>
> {
  declare id: CreationOptional<number>;
  declare subObjectiveId: number;
  declare locale: string;
  declare title: string;
}

SubObjectiveTranslation.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    subObjectiveId: { type: DataTypes.INTEGER, allowNull: false },
    locale: { type: DataTypes.STRING(8), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
  },
  { sequelize, tableName: 'sub_objective_translations', underscored: true },
);

class Topic extends Model<InferAttributes<Topic>, InferCreationAttributes<Topic>> {
  declare id: CreationOptional<number>;
  declare subObjectiveId: number;
  declare code: string;
  declare nameEn: CreationOptional<string | null>;
  declare nameFr: CreationOptional<string | null>;
}

Topic.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    subObjectiveId: { type: DataTypes.INTEGER, allowNull: false },
    code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
    nameEn: { type: DataTypes.STRING(255), allowNull: true },
    nameFr: { type: DataTypes.STRING(255), allowNull: true },
  },
  { sequelize, tableName: 'topics', underscored: true },
);

class TopicTranslation extends Model<
  InferAttributes<TopicTranslation>,
  InferCreationAttributes<TopicTranslation>
> {
  declare id: CreationOptional<number>;
  declare topicId: number;
  declare locale: string;
  declare name: string;
}

TopicTranslation.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    topicId: { type: DataTypes.INTEGER, allowNull: false },
    locale: { type: DataTypes.STRING(8), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
  },
  { sequelize, tableName: 'topic_translations', underscored: true },
);

Exam.hasMany(Domain, { foreignKey: 'examId', as: 'domains' });
Domain.belongsTo(Exam, { foreignKey: 'examId', as: 'exam' });

Domain.hasMany(DomainTranslation, { foreignKey: 'domainId', as: 'translations' });
DomainTranslation.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

Domain.hasMany(Objective, { foreignKey: 'domainId', as: 'objectives' });
Objective.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

Objective.hasMany(ObjectiveTranslation, { foreignKey: 'objectiveId', as: 'translations' });
ObjectiveTranslation.belongsTo(Objective, { foreignKey: 'objectiveId', as: 'objective' });

Objective.hasMany(SubObjective, { foreignKey: 'objectiveId', as: 'subObjectives' });
SubObjective.belongsTo(Objective, { foreignKey: 'objectiveId', as: 'objective' });

SubObjective.hasMany(SubObjectiveTranslation, { foreignKey: 'subObjectiveId', as: 'translations' });
SubObjectiveTranslation.belongsTo(SubObjective, { foreignKey: 'subObjectiveId', as: 'subObjective' });

SubObjective.hasMany(Topic, { foreignKey: 'subObjectiveId', as: 'topics' });
Topic.belongsTo(SubObjective, { foreignKey: 'subObjectiveId', as: 'subObjective' });

Topic.hasMany(TopicTranslation, { foreignKey: 'topicId', as: 'translations' });
TopicTranslation.belongsTo(Topic, { foreignKey: 'topicId', as: 'topic' });

export {
  Domain,
  DomainTranslation,
  Exam,
  Objective,
  ObjectiveTranslation,
  SubObjective,
  SubObjectiveTranslation,
  Topic,
  TopicTranslation,
};
