import { Op } from 'sequelize';

import {
  GenerationRun,
  Question,
  QuestionChoice,
  SubObjective,
  Topic,
  UserAnswer,
  UserMastery,
} from '../../db/models/index.js';
import { sequelize } from '../../db/sequelize.js';

type Locale = 'fr' | 'en';

class QcmRepository {
  private pickLocalized(input: { en?: string | null; fr?: string | null; locale: Locale; fallback: string }): string {
    if (input.locale === 'fr') {
      return input.fr ?? input.en ?? input.fallback;
    }
    return input.en ?? input.fr ?? input.fallback;
  }

  findSubObjective(subObjectiveId: number): Promise<SubObjective | null> {
    return SubObjective.findByPk(subObjectiveId);
  }

  async getSubObjectiveContext(subObjectiveId: number, locale: Locale): Promise<{
    title: string;
    topics: string[];
  }> {
    const subObjective = await SubObjective.findByPk(subObjectiveId);

    const topicRows = await Topic.findAll({
      where: { subObjectiveId },
      order: [['code', 'ASC']],
    });

    const topics = topicRows.map((topic) => {
      return this.pickLocalized({
        en: topic.nameEn,
        fr: topic.nameFr,
        locale,
        fallback: topic.code,
      });
    });

    const fallbackTitle = `Sub-objective ${subObjectiveId}`;
    const title = this.pickLocalized({
      en: subObjective?.titleEn ?? null,
      fr: subObjective?.titleFr ?? null,
      locale,
      fallback: fallbackTitle,
    });

    return { title, topics };
  }

  async getQuestions(subObjectiveId: number, lang: Locale): Promise<Question[]> {
    return Question.findAll({
      where: {
        subObjectiveId,
        [Op.or]: [{ language: lang }, { language: 'bi' }],
      },
      include: [{ model: QuestionChoice, as: 'choices' }],
      order: [['id', 'DESC']],
    });
  }

  async getQuestionsByDifficulty(subObjectiveId: number, lang: Locale, difficulty: number): Promise<Question[]> {
    return Question.findAll({
      where: {
        subObjectiveId,
        difficulty,
        [Op.or]: [{ language: lang }, { language: 'bi' }],
      },
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
    language: Locale | 'bi';
    questionTextEn: string;
    questionTextFr: string;
    explanationEn: string;
    explanationFr: string;
    difficulty: number;
    choices: Array<{ textEn: string; textFr: string; isCorrect: boolean }>;
  }): Promise<Question> {
    const question = await Question.create({
      subObjectiveId: input.subObjectiveId,
      language: input.language,
      questionText: input.questionTextEn,
      explanation: input.explanationEn,
      questionTextEn: input.questionTextEn,
      questionTextFr: input.questionTextFr,
      explanationEn: input.explanationEn,
      explanationFr: input.explanationFr,
      difficulty: input.difficulty,
      source: 'generated',
    });

    for (const choice of input.choices) {
      await QuestionChoice.create({
        questionId: question.id,
        choiceText: choice.textEn,
        choiceTextEn: choice.textEn,
        choiceTextFr: choice.textFr,
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
