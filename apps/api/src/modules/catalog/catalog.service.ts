import { CatalogRepository } from './catalog.repo.js';

type Locale = 'fr' | 'en';

class CatalogService {
  constructor(private readonly repo: CatalogRepository) {}

  getExams() {
    return this.repo.getExams();
  }

  getDomains(examCode: string, locale: Locale) {
    return this.repo.getDomains(examCode, locale);
  }

  getObjectives(domainCode: string, locale: Locale) {
    return this.repo.getObjectives(domainCode, locale);
  }

  getSubObjectives(objectiveCode: string, locale: Locale) {
    return this.repo.getSubObjectives(objectiveCode, locale);
  }

  getTopics(subObjectiveCode: string, locale: Locale) {
    return this.repo.getTopics(subObjectiveCode, locale);
  }
}

export { CatalogService };
