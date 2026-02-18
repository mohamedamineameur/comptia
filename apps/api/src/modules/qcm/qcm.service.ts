import { AppError } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';
import type { Question, QuestionChoice } from '../../db/models/index.js';
import { generateQuestionsWithOpenAI } from './qcm.openai.js';
import { QcmRepository } from './qcm.repo.js';

type Locale = 'fr' | 'en';
type PublicQuestion = {
  id: number;
  subObjectiveId: number;
  language: string;
  questionText: string;
  explanation: string;
  difficulty: number;
  source: string;
  choices: Array<{ id: number; choiceText: string }>;
};

class QcmService {
  constructor(private readonly repo: QcmRepository) {}

  private pickLocalized(input: { en?: string | null; fr?: string | null; locale: Locale; fallback: string }): string {
    if (input.locale === 'fr') {
      return input.fr ?? input.en ?? input.fallback;
    }
    return input.en ?? input.fr ?? input.fallback;
  }

  private toPublicQuestion(question: Question, locale: Locale): PublicQuestion {
    const choices = (question.get('choices') as QuestionChoice[]).map((choice) => ({
      id: choice.id,
      choiceText: this.pickLocalized({
        en: choice.choiceTextEn,
        fr: choice.choiceTextFr,
        locale,
        fallback: choice.choiceText,
      }),
    }));

    return {
      id: question.id,
      subObjectiveId: question.subObjectiveId,
      language: question.language,
      questionText: this.pickLocalized({
        en: question.questionTextEn,
        fr: question.questionTextFr,
        locale,
        fallback: question.questionText,
      }),
      explanation: this.pickLocalized({
        en: question.explanationEn,
        fr: question.explanationFr,
        locale,
        fallback: question.explanation,
      }),
      difficulty: question.difficulty,
      source: question.source,
      choices,
    };
  }

  async getQuestions(subObjectiveId: number, lang: Locale): Promise<PublicQuestion[]> {
    const rows = await this.repo.getQuestions(subObjectiveId, lang);
    return rows.map((item) => this.toPublicQuestion(item, lang));
  }

  async generate(input: {
    subObjectiveId: number;
    lang: Locale;
    difficulty: number;
    count: number;
    userId: number;
  }): Promise<PublicQuestion[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const todayCount = await this.repo.countUserDailyGenerations(input.userId, start, end);
    if (todayCount >= env.qcm.dailyGenerationLimit) {
      throw new AppError('DAILY_GENERATION_QUOTA_EXCEEDED', 429);
    }

    const subObjective = await this.repo.findSubObjective(input.subObjectiveId);
    if (!subObjective) {
      throw new AppError('SUB_OBJECTIVE_NOT_FOUND', 404);
    }

    const existing = await this.repo.getQuestionsByDifficulty(input.subObjectiveId, input.lang, input.difficulty);
    if (existing.length >= input.count) {
      return existing.slice(0, input.count).map((item) => this.toPublicQuestion(item, input.lang));
    }

    const context = await this.repo.getSubObjectiveContext(input.subObjectiveId, input.lang);
    const needed = input.count - existing.length;
    const created: Question[] = [];

    let generated: Awaited<ReturnType<typeof generateQuestionsWithOpenAI>>;
    try {
      generated = await generateQuestionsWithOpenAI({
        subObjectiveTitle: context.title,
        topics: context.topics,
        lang: input.lang,
        difficulty: input.difficulty,
        count: needed,
      });

      await this.repo.createGenerationRun({
        subObjectiveId: input.subObjectiveId,
        language: input.lang,
        createdByUserId: input.userId,
        model: env.openai.model,
        promptVersion: 'v1',
        status: 'completed',
        costTokens: generated.costTokens,
      });
    } catch (error) {
      await this.repo.createGenerationRun({
        subObjectiveId: input.subObjectiveId,
        language: input.lang,
        createdByUserId: input.userId,
        model: env.openai.model,
        promptVersion: 'v1',
        status: 'failed',
      });
      throw error;
    }

    for (const item of generated.questions) {
      const question = await this.repo.createQuestionWithChoices({
        subObjectiveId: input.subObjectiveId,
        language: 'bi',
        questionTextEn: item.questionText,
        questionTextFr: item.questionText,
        explanationEn: item.explanation,
        explanationFr: item.explanation,
        difficulty: input.difficulty,
        choices: item.choices.map((choice) => ({
          textEn: choice.text,
          textFr: choice.text,
          isCorrect: choice.isCorrect,
        })),
      });
      created.push(question);
    }

    return [...existing, ...created].slice(0, input.count).map((item) => this.toPublicQuestion(item, input.lang));
  }

  async answer(input: {
    userId: number;
    questionId: number;
    choiceId: number;
    locale: Locale;
    timeSpentMs?: number;
  }): Promise<{
    isCorrect: boolean;
    explanation: string;
    correctChoiceId: number;
    masteryScore: number;
  }> {
    const question = await this.repo.findQuestionWithChoices(input.questionId);
    if (!question) {
      throw new AppError('QUESTION_NOT_FOUND', 404);
    }
    const choices = question.get('choices') as QuestionChoice[];
    const selected = choices.find((choice) => choice.id === input.choiceId);
    const correct = choices.find((choice) => choice.isCorrect);

    if (!selected || !correct) {
      throw new AppError('INVALID_CHOICE', 400);
    }

    const isCorrect = selected.isCorrect;
    await this.repo.createUserAnswer({
      userId: input.userId,
      questionId: question.id,
      selectedChoiceId: selected.id,
      isCorrect,
      timeSpentMs: input.timeSpentMs,
    });

    const previousMastery = await this.repo.findUserMastery(input.userId, question.subObjectiveId);
    const stats = await this.repo.getUserSubObjectiveStats(input.userId, question.subObjectiveId);
    const masteryScore = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    const streak = isCorrect ? (previousMastery?.streak ?? 0) + 1 : 0;

    await this.repo.upsertUserMastery({
      userId: input.userId,
      subObjectiveId: question.subObjectiveId,
      masteryScore,
      streak,
    });

    return {
      isCorrect,
      explanation: this.pickLocalized({
        en: question.explanationEn,
        fr: question.explanationFr,
        locale: input.locale,
        fallback: question.explanation,
      }),
      correctChoiceId: correct.id,
      masteryScore,
    };
  }
}

export { QcmService };
