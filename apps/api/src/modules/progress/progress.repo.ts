import { Op } from 'sequelize';

import {
  Domain,
  DomainTranslation,
  Objective,
  Question,
  SubObjective,
  SubObjectiveTranslation,
  UserAnswer,
  UserMastery,
} from '../../db/models/index.js';

type Locale = 'fr' | 'en';

class ProgressRepository {
  async getSummary(userId: number): Promise<{
    answered: number;
    correct: number;
    accuracy: number;
    averageMastery: number;
    streak: number;
  }> {
    const answers = await UserAnswer.findAll({ where: { userId } });
    const answered = answers.length;
    const correct = answers.filter((answer) => answer.isCorrect).length;
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    const masteryRows = await UserMastery.findAll({ where: { userId } });
    const averageMastery =
      masteryRows.length > 0
        ? Math.round(masteryRows.reduce((sum, entry) => sum + entry.masteryScore, 0) / masteryRows.length)
        : 0;
    const streak = masteryRows.reduce((max, entry) => Math.max(max, entry.streak), 0);

    return { answered, correct, accuracy, averageMastery, streak };
  }

  async getBySubObjective(userId: number, locale: Locale): Promise<
    Array<{
      subObjectiveId: number;
      subObjectiveCode: string;
      title: string;
      masteryScore: number;
      streak: number;
      lastActivityAt: Date;
    }>
  > {
    const entries = await UserMastery.findAll({
      where: { userId },
      include: [
        {
          model: SubObjective,
          as: 'subObjective',
          include: [
            {
              model: SubObjectiveTranslation,
              as: 'translations',
              where: { locale: { [Op.in]: [locale, 'en'] } },
              required: false,
            },
          ],
        },
      ],
      order: [['lastActivityAt', 'DESC']],
    });

    return entries.map((entry) => {
      const subObjective = entry.get('subObjective') as SubObjective;
      const translations = subObjective.get('translations') as SubObjectiveTranslation[];
      const selected =
        translations.find((item) => item.locale === locale) ??
        translations.find((item) => item.locale === 'en');
      return {
        subObjectiveId: subObjective.id,
        subObjectiveCode: subObjective.code,
        title: selected?.title ?? subObjective.code,
        masteryScore: entry.masteryScore,
        streak: entry.streak,
        lastActivityAt: entry.lastActivityAt,
      };
    });
  }

  async getByDomain(userId: number, locale: Locale): Promise<Array<{ domainCode: string; name: string; masteryScore: number }>> {
    const entries = await UserMastery.findAll({
      where: { userId },
      include: [
        {
          model: SubObjective,
          as: 'subObjective',
          include: [
            {
              model: Objective,
              as: 'objective',
              include: [
                {
                  model: Domain,
                  as: 'domain',
                  include: [
                    {
                      model: DomainTranslation,
                      as: 'translations',
                      where: { locale: { [Op.in]: [locale, 'en'] } },
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const buckets = new Map<string, { name: string; total: number; count: number }>();
    for (const entry of entries) {
      const subObjective = entry.get('subObjective') as SubObjective;
      const objective = subObjective.get('objective') as Objective;
      const domain = objective.get('domain') as Domain;
      const translations = domain.get('translations') as DomainTranslation[];
      const selected =
        translations.find((item) => item.locale === locale) ??
        translations.find((item) => item.locale === 'en');
      const key = domain.code;
      const bucket = buckets.get(key) ?? { name: selected?.name ?? key, total: 0, count: 0 };
      bucket.total += entry.masteryScore;
      bucket.count += 1;
      buckets.set(key, bucket);
    }

    return Array.from(buckets.entries()).map(([domainCode, bucket]) => ({
      domainCode,
      name: bucket.name,
      masteryScore: bucket.count > 0 ? Math.round(bucket.total / bucket.count) : 0,
    }));
  }

  async getDailyStats(userId: number, days = 7): Promise<Array<{ day: string; answered: number; correct: number }>> {
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    from.setHours(0, 0, 0, 0);

    const answers = await UserAnswer.findAll({
      where: {
        userId,
        answeredAt: { [Op.gte]: from },
      },
      order: [['answeredAt', 'ASC']],
    });

    const bucket = new Map<string, { answered: number; correct: number }>();
    for (let i = 0; i < days; i += 1) {
      const date = new Date(from);
      date.setDate(from.getDate() + i);
      const key = date.toISOString().slice(0, 10);
      bucket.set(key, { answered: 0, correct: 0 });
    }

    for (const answer of answers) {
      const key = answer.answeredAt.toISOString().slice(0, 10);
      const current = bucket.get(key);
      if (!current) {
        continue;
      }
      current.answered += 1;
      if (answer.isCorrect) {
        current.correct += 1;
      }
      bucket.set(key, current);
    }

    return Array.from(bucket.entries()).map(([day, value]) => ({
      day,
      answered: value.answered,
      correct: value.correct,
    }));
  }

  async getWeakAreas(userId: number, locale: Locale, limit = 3): Promise<
    Array<{ subObjectiveId: number; subObjectiveCode: string; title: string; masteryScore: number }>
  > {
    const entries = await UserMastery.findAll({
      where: { userId },
      include: [
        {
          model: SubObjective,
          as: 'subObjective',
          include: [
            {
              model: SubObjectiveTranslation,
              as: 'translations',
              where: { locale: { [Op.in]: [locale, 'en'] } },
              required: false,
            },
          ],
        },
      ],
      order: [['masteryScore', 'ASC']],
      limit,
    });

    return entries.map((entry) => {
      const subObjective = entry.get('subObjective') as SubObjective;
      const translations = subObjective.get('translations') as SubObjectiveTranslation[];
      const selected =
        translations.find((item) => item.locale === locale) ??
        translations.find((item) => item.locale === 'en');
      return {
        subObjectiveId: subObjective.id,
        subObjectiveCode: subObjective.code,
        title: selected?.title ?? subObjective.code,
        masteryScore: entry.masteryScore,
      };
    });
  }

  async getNextBestSubObjective(userId: number, locale: Locale): Promise<{
    subObjectiveId: number;
    subObjectiveCode: string;
    title: string;
    rationale: string;
  } | null> {
    const weak = await this.getWeakAreas(userId, locale, 1);
    if (weak.length > 0) {
      const candidate = weak[0];
      return {
        subObjectiveId: candidate.subObjectiveId,
        subObjectiveCode: candidate.subObjectiveCode,
        title: candidate.title,
        rationale:
          locale === 'fr'
            ? 'Mastery faible, prioritaire pour augmenter ton score global.'
            : 'Low mastery, highest impact to improve your global score.',
      };
    }

    const answeredQuestionIds = (
      await UserAnswer.findAll({
        where: { userId },
        attributes: ['questionId'],
      })
    ).map((row) => row.questionId);

    const unseenQuestion = await Question.findOne({
      where: answeredQuestionIds.length > 0 ? { id: { [Op.notIn]: answeredQuestionIds } } : undefined,
      include: [
        {
          model: SubObjective,
          as: 'subObjective',
          include: [
            {
              model: SubObjectiveTranslation,
              as: 'translations',
              where: { locale: { [Op.in]: [locale, 'en'] } },
              required: false,
            },
          ],
        },
      ],
      order: [['id', 'ASC']],
    });

    if (!unseenQuestion) {
      return null;
    }

    const subObjective = unseenQuestion.get('subObjective') as SubObjective;
    const translations = subObjective.get('translations') as SubObjectiveTranslation[];
    const selected =
      translations.find((item) => item.locale === locale) ??
      translations.find((item) => item.locale === 'en');

    return {
      subObjectiveId: subObjective.id,
      subObjectiveCode: subObjective.code,
      title: selected?.title ?? subObjective.code,
      rationale:
        locale === 'fr'
          ? 'Nouveau sous-objectif non pratique, bon candidat pour progresser.'
          : 'Unseen sub-objective, good candidate to progress.',
    };
  }
}

export { ProgressRepository };
