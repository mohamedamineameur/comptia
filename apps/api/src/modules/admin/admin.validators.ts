import { AppError } from '../../common/errors/app-error.js';

function parseManualQuestionBody(input: unknown): {
  subObjectiveId: number;
  language: 'fr' | 'en';
  questionText: string;
  explanation: string;
  difficulty: number;
  choices: Array<{ text: string; isCorrect: boolean }>;
} {
  if (!input || typeof input !== 'object') {
    throw new AppError('ADMIN_INVALID_PAYLOAD', 400);
  }
  const body = input as Record<string, unknown>;
  const subObjectiveId = Number(body.subObjectiveId);
  const difficulty = Number(body.difficulty);
  const language = body.language === 'en' ? 'en' : body.language === 'fr' ? 'fr' : null;
  const questionText = typeof body.questionText === 'string' ? body.questionText.trim() : '';
  const explanation = typeof body.explanation === 'string' ? body.explanation.trim() : '';
  const rawChoices = Array.isArray(body.choices) ? body.choices : [];

  if (!Number.isInteger(subObjectiveId) || subObjectiveId <= 0) {
    throw new AppError('ADMIN_INVALID_PAYLOAD', 400, { field: 'subObjectiveId' });
  }
  if (!language) {
    throw new AppError('ADMIN_INVALID_PAYLOAD', 400, { field: 'language' });
  }
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    throw new AppError('ADMIN_INVALID_PAYLOAD', 400, { field: 'difficulty' });
  }
  if (questionText.length < 10 || explanation.length < 10) {
    throw new AppError('ADMIN_INVALID_PAYLOAD', 400, { field: 'question' });
  }

  const choices = rawChoices
    .map((choice) => {
      if (!choice || typeof choice !== 'object') {
        return null;
      }
      const row = choice as Record<string, unknown>;
      const text = typeof row.text === 'string' ? row.text.trim() : '';
      const isCorrect = row.isCorrect === true;
      if (!text) {
        return null;
      }
      return { text, isCorrect };
    })
    .filter((entry): entry is { text: string; isCorrect: boolean } => Boolean(entry));

  if (choices.length !== 4 || choices.filter((item) => item.isCorrect).length !== 1) {
    throw new AppError('ADMIN_INVALID_PAYLOAD', 400, { field: 'choices' });
  }

  return { subObjectiveId, language, questionText, explanation, difficulty, choices };
}

export { parseManualQuestionBody };
