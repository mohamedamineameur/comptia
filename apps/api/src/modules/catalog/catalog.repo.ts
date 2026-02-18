import {
  Domain,
  Exam,
  Objective,
  SubObjective,
  Topic,
} from '../../db/models/index.js';

type Locale = 'fr' | 'en';

class CatalogRepository {
  private pickLocalized(input: { en?: string | null; fr?: string | null; locale: Locale; fallback: string }): string {
    if (input.locale === 'fr') {
      return input.fr ?? input.en ?? input.fallback;
    }
    return input.en ?? input.fr ?? input.fallback;
  }

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
      include: [{ model: Exam, as: 'exam', attributes: [], where: { code: examCode } }],
      order: [['code', 'ASC']],
    });

    return domains.map((domain) => {
      const fallback = domain.code;
      return {
        id: domain.id,
        code: domain.code,
        name: this.pickLocalized({
          en: domain.nameEn,
          fr: domain.nameFr,
          locale,
          fallback,
        }),
      };
    });
  }

  async getObjectives(
    domainCode: string,
    locale: Locale,
  ): Promise<Array<{ id: number; code: string; title: string }>> {
    const objectives = await Objective.findAll({
      attributes: ['id', 'code'],
      include: [{ model: Domain, as: 'domain', attributes: [], where: { code: domainCode } }],
      order: [['code', 'ASC']],
    });

    return objectives.map((objective) => {
      const fallback = objective.code;
      return {
        id: objective.id,
        code: objective.code,
        title: this.pickLocalized({
          en: objective.titleEn,
          fr: objective.titleFr,
          locale,
          fallback,
        }),
      };
    });
  }

  async getSubObjectives(
    objectiveCode: string,
    locale: Locale,
  ): Promise<Array<{ id: number; code: string; title: string }>> {
    const subObjectives = await SubObjective.findAll({
      attributes: ['id', 'code'],
      include: [{ model: Objective, as: 'objective', attributes: [], where: { code: objectiveCode } }],
      order: [['code', 'ASC']],
    });

    return subObjectives.map((subObjective) => {
      const fallback = subObjective.code;
      return {
        id: subObjective.id,
        code: subObjective.code,
        title: this.pickLocalized({
          en: subObjective.titleEn,
          fr: subObjective.titleFr,
          locale,
          fallback,
        }),
      };
    });
  }

  async getTopics(subObjectiveCode: string, locale: Locale): Promise<Array<{ id: number; code: string; name: string }>> {
    const topics = await Topic.findAll({
      attributes: ['id', 'code'],
      include: [{ model: SubObjective, as: 'subObjective', attributes: [], where: { code: subObjectiveCode } }],
      order: [['code', 'ASC']],
    });

    return topics.map((topic) => {
      const fallback = topic.code;
      return {
        id: topic.id,
        code: topic.code,
        name: this.pickLocalized({
          en: topic.nameEn,
          fr: topic.nameFr,
          locale,
          fallback,
        }),
      };
    });
  }
}

export { CatalogRepository };
