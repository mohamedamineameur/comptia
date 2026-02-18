import { z } from 'zod';

import { AppError } from '../../common/errors/app-error.js';
import { env } from '../../config/env.js';

type Locale = 'fr' | 'en';

const generatedQuestionSchema = z.object({
  questionText: z.string().min(10),
  explanation: z.string().min(10),
  choices: z
    .array(
      z.object({
        text: z.string().min(1),
        isCorrect: z.boolean(),
      }),
    )
    .length(4)
    .refine((items) => items.filter((item) => item.isCorrect).length === 1, 'Exactly one correct choice'),
});

const generatedPayloadSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(1),
});

type GeneratedPayload = z.infer<typeof generatedPayloadSchema>;

function buildSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      questions: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            questionText: { type: 'string' },
            explanation: { type: 'string' },
            choices: {
              type: 'array',
              minItems: 4,
              maxItems: 4,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  text: { type: 'string' },
                  isCorrect: { type: 'boolean' },
                },
                required: ['text', 'isCorrect'],
              },
            },
          },
          required: ['questionText', 'explanation', 'choices'],
        },
      },
    },
    required: ['questions'],
  };
}

function readOutputText(payload: unknown): string {
  if (typeof payload !== 'object' || payload === null) {
    throw new AppError('OPENAI_EMPTY_RESPONSE', 502);
  }

  const record = payload as Record<string, unknown>;
  if (typeof record.output_text === 'string' && record.output_text.length > 0) {
    return record.output_text;
  }

  const outputs = Array.isArray(record.output) ? record.output : [];
  for (const outputItem of outputs) {
    if (typeof outputItem !== 'object' || outputItem === null) {
      continue;
    }
    const contentRaw = (outputItem as Record<string, unknown>).content;
    const content = Array.isArray(contentRaw) ? contentRaw : [];
    for (const chunk of content) {
      if (typeof chunk !== 'object' || chunk === null) {
        continue;
      }
      const chunkRecord = chunk as Record<string, unknown>;
      if (chunkRecord.type === 'output_text' && typeof chunkRecord.text === 'string') {
        return chunkRecord.text;
      }
    }
  }
  throw new AppError('OPENAI_EMPTY_RESPONSE', 502);
}

async function generateQuestionsWithOpenAI(input: {
  subObjectiveTitle: string;
  topics: string[];
  lang: Locale;
  difficulty: number;
  count: number;
}): Promise<{ questions: GeneratedPayload['questions']; costTokens: number | null }> {
  if (!env.openai.apiKey) {
    throw new AppError('OPENAI_API_KEY_MISSING', 500);
  }

  const systemPrompt =
    input.lang === 'fr'
      ? "Tu es un generateur de QCM de cybersecurite. Produis uniquement des questions d'entrainement pedagogiques (pas de questions d'examen reelles), avec exactement une bonne reponse."
      : 'You generate cybersecurity practice MCQs only (never real exam dump questions), with exactly one correct answer.';

  const userPrompt =
    input.lang === 'fr'
      ? `Sous-objectif: ${input.subObjectiveTitle}\nTopics: ${input.topics.join(', ') || 'general'}\nDifficulte: ${input.difficulty}/5\nNombre: ${input.count}\nDonne des questions claires, utiles et variees.`
      : `Sub-objective: ${input.subObjectiveTitle}\nTopics: ${input.topics.join(', ') || 'general'}\nDifficulty: ${input.difficulty}/5\nCount: ${input.count}\nProvide clear, useful and varied questions.`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openai.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.openai.model,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: systemPrompt }] },
        { role: 'user', content: [{ type: 'input_text', text: userPrompt }] },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'qcm_generation',
          schema: buildSchema(),
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new AppError('OPENAI_API_FAILED', 502, { status: response.status });
  }

  const payload: unknown = await response.json();
  const outputText = readOutputText(payload);
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(outputText);
  } catch {
    throw new AppError('OPENAI_INVALID_FORMAT', 502);
  }
  const validatedResult = generatedPayloadSchema.safeParse(parsedJson);
  if (!validatedResult.success) {
    throw new AppError('OPENAI_INVALID_FORMAT', 502);
  }
  const validated = validatedResult.data;
  const payloadRecord = (typeof payload === 'object' && payload !== null
    ? (payload as Record<string, unknown>)
    : null) as Record<string, unknown> | null;
  const usageRaw = payloadRecord?.usage;
  const totalTokens =
    typeof usageRaw === 'object' && usageRaw !== null
      ? (usageRaw as Record<string, unknown>).total_tokens
      : undefined;
  const costTokens = typeof totalTokens === 'number' ? Number(totalTokens) : null;

  return { questions: validated.questions.slice(0, input.count), costTokens };
}

export { generateQuestionsWithOpenAI };
