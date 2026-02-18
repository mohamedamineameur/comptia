import { Op } from 'sequelize';

import {
  GenerationRun,
  Question,
  QuestionChoice,
  SubObjective,
  SubObjectiveTranslation,
  Topic,
  TopicTranslation,
  UserAnswer,
  UserMastery,
} from '../../db/models/index.js';
import { sequelize } from '../../db/sequelize.js';

type Locale = 'fr' | 'en';

class QcmRepository {
  findSubObjective(subObjectiveId: number): Promise<SubObjective | null> {
    return SubObjective.findByPk(subObjectiveId);
  }

  async getSubObjectiveContext(subObjectiveId: number, locale: Locale): Promise<{
    title: string;
    topics: string[];
  }> {
    const translation = await SubObjectiveTranslation.findOne({
      where: {
        subObjectiveId,
        locale: { [Op.in]: [locale, 'en'] },
      },
      order: [['locale', 'ASC']],
    });

    const topicRows = await Topic.findAll({
      where: { subObjectiveId },
      include: [
        {
          model: TopicTranslation,
          as: 'translations',
          where: { locale: { [Op.in]: [locale, 'en'] } },
          required: false,
        },
      ],
      order: [['code', 'ASC']],
    });

    const topics = topicRows.map((topic) => {
      const translations = topic.get('translations') as TopicTranslation[];
      const selected =
        translations.find((entry) => entry.locale === locale) ??
        translations.find((entry) => entry.locale === 'en');
      return selected?.name ?? topic.code;
    });

    return { title: translation?.title ?? `Sub-objective ${subObjectiveId}`, topics };
  }

  async getQuestions(subObjectiveId: number, lang: Locale): Promise<Question[]> {
    return Question.findAll({
      where: { subObjectiveId, language: lang },
      include: [{ model: QuestionChoice, as: 'choices' }],
      order: [['id', 'DESC']],
    });
  }

  async getQuestionsByDifficulty(subObjectiveId: number, lang: Locale, difficulty: number): Promise<Question[]> {
    return Question.findAll({
      where: { subObjectiveId, language: lang, difficulty },
      include: [{ model: QuestionChoice, as: 'choices' }],
      order: [['id', 'DESC']],
    });
  }

  createGenerationRun(input: {
    subObjectiveId: number;
    language: Locale;
    createdByUserId: number;
    model: string;
    promptVersion: string;
    status: string;
    costTokens?: number | null;
  }): Promise<GenerationRun> {
    return GenerationRun.create(input);
  }

  countUserDailyGenerations(userId: number, start: Date, end: Date): Promise<number> {
    return GenerationRun.count({
      where: {
        createdByUserId: userId,
        [Op.and]: [
          sequelize.where(sequelize.col('created_at'), Op.gte, start),
          sequelize.where(sequelize.col('created_at'), Op.lt, end),
        ],
      },
    });
  }

  async createQuestionWithChoices(input: {
    subObjectiveId: number;
    language: Locale;
    questionText: string;
    explanation: string;
    difficulty: number;
    choices: Array<{ text: string; isCorrect: boolean }>;
  }): Promise<Question> {
    const question = await Question.create({
      subObjectiveId: input.subObjectiveId,
      language: input.language,
      questionText: input.questionText,
      explanation: input.explanation,
      difficulty: input.difficulty,
      source: 'generated',
    });

    for (const choice of input.choices) {
      await QuestionChoice.create({
        questionId: question.id,
        choiceText: choice.text,
        isCorrect: choice.isCorrect,
      });
    }

    return Question.findByPk(question.id, {
      include: [{ model: QuestionChoice, as: 'choices' }],
      rejectOnEmpty: true,
    });
  }

  findQuestionWithChoices(questionId: number): Promise<Question | null> {
    return Question.findByPk(questionId, {
      include: [{ model: QuestionChoice, as: 'choices' }],
    });
  }

  createUserAnswer(input: {
    userId: number;
    questionId: number;
    selectedChoiceId: number;
    isCorrect: boolean;
    timeSpentMs?: number;
  }): Promise<UserAnswer> {
    return UserAnswer.create({
      userId: input.userId,
      questionId: input.questionId,
      selectedChoiceId: input.selectedChoiceId,
      isCorrect: input.isCorrect,
      timeSpentMs: input.timeSpentMs ?? null,
    });
  }

  async getUserSubObjectiveStats(userId: number, subObjectiveId: number): Promise<{ total: number; correct: number }> {
    const answers = await UserAnswer.findAll({
      where: { userId },
      include: [{ model: Question, as: 'question', where: { subObjectiveId }, attributes: ['id'] }],
    });
    const total = answers.length;
    const correct = answers.filter((answer) => answer.isCorrect).length;
    return { total, correct };
  }

  async upsertUserMastery(input: {
    userId: number;
    subObjectiveId: number;
    masteryScore: number;
    streak: number;
  }): Promise<void> {
    const existing = await UserMastery.findOne({
      where: { userId: input.userId, subObjectiveId: input.subObjectiveId },
    });
    if (existing) {
      await existing.update({
        masteryScore: input.masteryScore,
        lastActivityAt: new Date(),
        streak: input.streak,
      });
      return;
    }
    await UserMastery.create({
      userId: input.userId,
      subObjectiveId: input.subObjectiveId,
      masteryScore: input.masteryScore,
      lastActivityAt: new Date(),
      streak: input.streak,
    });
  }

  findUserMastery(userId: number, subObjectiveId: number): Promise<UserMastery | null> {
    return UserMastery.findOne({ where: { userId, subObjectiveId } });
  }
}

export { QcmRepository };
