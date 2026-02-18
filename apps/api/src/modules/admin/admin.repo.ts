import {
  Domain,
  Exam,
  GenerationRun,
  Objective,
  Question,
  QuestionChoice,
  SubObjective,
  Topic,
  User,
} from '../../db/models/index.js';

class AdminRepository {
  async getCounts() {
    const [
      users,
      exams,
      domains,
      objectives,
      subObjectives,
      topics,
      questions,
      choices,
      generationRuns,
    ] = await Promise.all([
      User.count(),
      Exam.count(),
      Domain.count(),
      Objective.count(),
      SubObjective.count(),
      Topic.count(),
      Question.count(),
      QuestionChoice.count(),
      GenerationRun.count(),
    ]);

    return {
      users,
      exams,
      domains,
      objectives,
      subObjectives,
      topics,
      questions,
      choices,
      generationRuns,
    };
  }

  async createManualQuestion(input: {
    subObjectiveId: number;
    language: 'fr' | 'en';
    questionText: string;
    explanation: string;
    difficulty: number;
    choices: Array<{ text: string; isCorrect: boolean }>;
  }) {
    const question = await Question.create({
      subObjectiveId: input.subObjectiveId,
      language: input.language,
      questionText: input.questionText,
      explanation: input.explanation,
      difficulty: input.difficulty,
      source: 'manual',
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
}

export { AdminRepository };
