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
    const questionTextEn = input.language === 'en' ? input.questionText : input.questionText;
    const questionTextFr = input.language === 'fr' ? input.questionText : input.questionText;
    const explanationEn = input.language === 'en' ? input.explanation : input.explanation;
    const explanationFr = input.language === 'fr' ? input.explanation : input.explanation;

    const question = await Question.create({
      subObjectiveId: input.subObjectiveId,
      language: 'bi',
      questionText: questionTextEn,
      explanation: explanationEn,
      questionTextEn,
      questionTextFr,
      explanationEn,
      explanationFr,
      difficulty: input.difficulty,
      source: 'manual',
    });

    for (const choice of input.choices) {
      await QuestionChoice.create({
        questionId: question.id,
        choiceText: choice.text,
        choiceTextEn: choice.text,
        choiceTextFr: choice.text,
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
