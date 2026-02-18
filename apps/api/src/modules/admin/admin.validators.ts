function parseManualQuestionBody(input: unknown): {
  subObjectiveId: number;
  language: 'fr' | 'en';
  questionText: string;
  explanation: string;
  difficulty: number;
  choices: Array<{ text: string; isCorrect: boolean }>;
} {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid admin payload');
  }
  const body = input as Record<string, unknown>;
  const subObjectiveId = Number(body.subObjectiveId);
  const difficulty = Number(body.difficulty);
  const language = body.language === 'en' ? 'en' : body.language === 'fr' ? 'fr' : null;
  const questionText = typeof body.questionText === 'string' ? body.questionText.trim() : '';
  const explanation = typeof body.explanation === 'string' ? body.explanation.trim() : '';
  const rawChoices = Array.isArray(body.choices) ? body.choices : [];

  if (!Number.isInteger(subObjectiveId) || subObjectiveId <= 0) {
    throw new Error('Invalid subObjectiveId');
  }
  if (!language) {
    throw new Error('Invalid language');
  }
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) {
    throw new Error('Invalid difficulty');
  }
  if (questionText.length < 10 || explanation.length < 10) {
    throw new Error('Invalid question payload');
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
    throw new Error('Invalid choices payload');
  }

  return { subObjectiveId, language, questionText, explanation, difficulty, choices };
}

export { parseManualQuestionBody };
