import { ProgressRepository } from './progress.repo.js';

type Locale = 'fr' | 'en';

class ProgressService {
  constructor(private readonly repo: ProgressRepository) {}

  getSummary(userId: number) {
    return this.repo.getSummary(userId);
  }

  getByDomain(userId: number, locale: Locale) {
    return this.repo.getByDomain(userId, locale);
  }

  getBySubObjective(userId: number, locale: Locale) {
    return this.repo.getBySubObjective(userId, locale);
  }

  getDailyStats(userId: number) {
    return this.repo.getDailyStats(userId, 7);
  }

  getWeakAreas(userId: number, locale: Locale) {
    return this.repo.getWeakAreas(userId, locale, 3);
  }

  getNextBest(userId: number, locale: Locale) {
    return this.repo.getNextBestSubObjective(userId, locale);
  }

  async getDashboard(userId: number, locale: Locale) {
    const [summary, byDomain, bySubObjective, daily, weakAreas, nextBest] = await Promise.all([
      this.getSummary(userId),
      this.getByDomain(userId, locale),
      this.getBySubObjective(userId, locale),
      this.getDailyStats(userId),
      this.getWeakAreas(userId, locale),
      this.getNextBest(userId, locale),
    ]);

    return { summary, byDomain, bySubObjective, daily, weakAreas, nextBest };
  }
}

export { ProgressService };
