import { Op } from 'sequelize';

import {
  Domain,
  DomainTranslation,
  Exam,
  Objective,
  ObjectiveTranslation,
  SubObjective,
  SubObjectiveTranslation,
  Topic,
  TopicTranslation,
} from '../../db/models/index.js';

type Locale = 'fr' | 'en';

class CatalogRepository {
  async getExams(): Promise<Array<{ id: number; code: string; title: string }>> {
    const exams = await Exam.findAll({
      attributes: ['id', 'code', 'title'],
      order: [['code', 'ASC']],
    });
    return exams.map((exam) => ({ id: exam.id, code: exam.code, title: exam.title }));
  }

  async getDomains(examCode: string, locale: Locale): Promise<Array<{ id: number; code: string; name: string }>> {
    const domains = await Domain.findAll({
      attributes: ['id', 'code'],
      include: [
        { model: Exam, as: 'exam', attributes: [], where: { code: examCode } },
        {
          model: DomainTranslation,
          as: 'translations',
          attributes: ['locale', 'name'],
          where: { locale: { [Op.in]: [locale, 'en'] } },
          required: false,
        },
      ],
      order: [['code', 'ASC']],
    });

    return domains.map((domain) => {
      const translations = domain.get('translations') as DomainTranslation[];
      const selected =
        translations.find((entry) => entry.locale === locale) ??
        translations.find((entry) => entry.locale === 'en');
      return { id: domain.id, code: domain.code, name: selected?.name ?? domain.code };
    });
  }

  async getObjectives(
    domainCode: string,
    locale: Locale,
  ): Promise<Array<{ id: number; code: string; title: string }>> {
    const objectives = await Objective.findAll({
      attributes: ['id', 'code'],
      include: [
        { model: Domain, as: 'domain', attributes: [], where: { code: domainCode } },
        {
          model: ObjectiveTranslation,
          as: 'translations',
          attributes: ['locale', 'title'],
          where: { locale: { [Op.in]: [locale, 'en'] } },
          required: false,
        },
      ],
      order: [['code', 'ASC']],
    });

    return objectives.map((objective) => {
      const translations = objective.get('translations') as ObjectiveTranslation[];
      const selected =
        translations.find((entry) => entry.locale === locale) ??
        translations.find((entry) => entry.locale === 'en');
      return { id: objective.id, code: objective.code, title: selected?.title ?? objective.code };
    });
  }

  async getSubObjectives(
    objectiveCode: string,
    locale: Locale,
  ): Promise<Array<{ id: number; code: string; title: string }>> {
    const subObjectives = await SubObjective.findAll({
      attributes: ['id', 'code'],
      include: [
        { model: Objective, as: 'objective', attributes: [], where: { code: objectiveCode } },
        {
          model: SubObjectiveTranslation,
          as: 'translations',
          attributes: ['locale', 'title'],
          where: { locale: { [Op.in]: [locale, 'en'] } },
          required: false,
        },
      ],
      order: [['code', 'ASC']],
    });

    return subObjectives.map((subObjective) => {
      const translations = subObjective.get('translations') as SubObjectiveTranslation[];
      const selected =
        translations.find((entry) => entry.locale === locale) ??
        translations.find((entry) => entry.locale === 'en');
      return { id: subObjective.id, code: subObjective.code, title: selected?.title ?? subObjective.code };
    });
  }

  async getTopics(subObjectiveCode: string, locale: Locale): Promise<Array<{ id: number; code: string; name: string }>> {
    const topics = await Topic.findAll({
      attributes: ['id', 'code'],
      include: [
        { model: SubObjective, as: 'subObjective', attributes: [], where: { code: subObjectiveCode } },
        {
          model: TopicTranslation,
          as: 'translations',
          attributes: ['locale', 'name'],
          where: { locale: { [Op.in]: [locale, 'en'] } },
          required: false,
        },
      ],
      order: [['code', 'ASC']],
    });

    return topics.map((topic) => {
      const translations = topic.get('translations') as TopicTranslation[];
      const selected =
        translations.find((entry) => entry.locale === locale) ??
        translations.find((entry) => entry.locale === 'en');
      return { id: topic.id, code: topic.code, name: selected?.name ?? topic.code };
    });
  }
}

export { CatalogRepository };
