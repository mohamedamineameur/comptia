import { seedBaselineCatalog } from '../../db/seeders/baseline.js';
import { AdminRepository } from './admin.repo.js';

class AdminService {
  constructor(private readonly repo: AdminRepository) {}

  getStatus() {
    return this.repo.getCounts();
  }

  async seedBaseline() {
    await seedBaselineCatalog();
    return this.getStatus();
  }

  createManualQuestion(input: {
    subObjectiveId: number;
    language: 'fr' | 'en';
    questionText: string;
    explanation: string;
    difficulty: number;
    choices: Array<{ text: string; isCorrect: boolean }>;
  }) {
    return this.repo.createManualQuestion(input);
  }
}

export { AdminService };
