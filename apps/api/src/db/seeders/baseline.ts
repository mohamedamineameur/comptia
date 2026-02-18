import {
  Domain,
  DomainTranslation,
  Exam,
  Objective,
  ObjectiveTranslation,
  Question,
  QuestionChoice,
  SubObjective,
  SubObjectiveTranslation,
  Topic,
  TopicTranslation,
} from '../models/index.js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

type RawExamFile = {
  exam: {
    name: string;
    code: string;
    domains: RawDomain[];
  };
};

type RawDomain = {
  id: string;
  name: string;
  objectives: RawObjective[];
};

type RawObjective = {
  id: string;
  title: string;
  sub_objectives: RawSubObjective[];
};

type RawSubObjective = {
  id: string;
  title: string;
  topics: string[];
};

async function loadQcmJson(): Promise<RawExamFile> {
  const candidates = [
    path.resolve(process.cwd(), 'qcm.json'),
    path.resolve(process.cwd(), '../../qcm.json'),
  ];

  let content: string | null = null;
  for (const candidate of candidates) {
    try {
      content = await readFile(candidate, 'utf-8');
      break;
    } catch {
      // try next candidate path
    }
  }

  if (!content) {
    throw new Error('qcm.json not found at expected locations');
  }

  const parsed = JSON.parse(content) as RawExamFile;
  if (!parsed?.exam?.code || !Array.isArray(parsed?.exam?.domains)) {
    throw new Error('qcm.json has invalid structure');
  }
  return parsed;
}

function uniqueDistractors(topics: string[], currentTopic: string): string[] {
  const candidates = topics.filter((topic) => topic !== currentTopic).slice(0, 3);
  while (candidates.length < 3) {
    candidates.push(`Related concept ${candidates.length + 1}`);
  }
  return candidates;
}

async function seedSubObjectiveQuestions(input: {
  subObjectiveId: number;
  subObjectiveCode: string;
  subObjectiveTitle: string;
  topics: string[];
}): Promise<void> {
  const baseTopics = input.topics.length > 0 ? input.topics : ['Core concept'];

  for (let topicIndex = 0; topicIndex < baseTopics.length; topicIndex += 1) {
    const topic = baseTopics[topicIndex];
    const distractors = uniqueDistractors(baseTopics, topic);

    const englishQuestionText = `Which item is explicitly part of "${input.subObjectiveTitle}"?`;
    const [questionEn] = await Question.findOrCreate({
      where: {
        subObjectiveId: input.subObjectiveId,
        language: 'en',
        difficulty: 2,
        questionText: `${englishQuestionText} (${topic})`,
      },
      defaults: {
        subObjectiveId: input.subObjectiveId,
        language: 'en',
        difficulty: 2,
        questionText: `${englishQuestionText} (${topic})`,
        explanation: `"${topic}" is listed in the topics for sub-objective ${input.subObjectiveCode}.`,
        source: 'manual',
      },
    });

    const enChoicesCount = await QuestionChoice.count({ where: { questionId: questionEn.id } });
    if (enChoicesCount === 0) {
      await QuestionChoice.bulkCreate([
        { questionId: questionEn.id, choiceText: topic, isCorrect: true },
        { questionId: questionEn.id, choiceText: distractors[0], isCorrect: false },
        { questionId: questionEn.id, choiceText: distractors[1], isCorrect: false },
        { questionId: questionEn.id, choiceText: distractors[2], isCorrect: false },
      ]);
    }

    const frenchQuestionText = `Quel element fait explicitement partie de "${input.subObjectiveTitle}" ?`;
    const [questionFr] = await Question.findOrCreate({
      where: {
        subObjectiveId: input.subObjectiveId,
        language: 'fr',
        difficulty: 2,
        questionText: `${frenchQuestionText} (${topic})`,
      },
      defaults: {
        subObjectiveId: input.subObjectiveId,
        language: 'fr',
        difficulty: 2,
        questionText: `${frenchQuestionText} (${topic})`,
        explanation: `"${topic}" fait partie des topics du sous-objectif ${input.subObjectiveCode}.`,
        source: 'manual',
      },
    });

    const frChoicesCount = await QuestionChoice.count({ where: { questionId: questionFr.id } });
    if (frChoicesCount === 0) {
      await QuestionChoice.bulkCreate([
        { questionId: questionFr.id, choiceText: topic, isCorrect: true },
        { questionId: questionFr.id, choiceText: distractors[0], isCorrect: false },
        { questionId: questionFr.id, choiceText: distractors[1], isCorrect: false },
        { questionId: questionFr.id, choiceText: distractors[2], isCorrect: false },
      ]);
    }
  }
}

async function seedBaselineCatalog(): Promise<void> {
  const raw = await loadQcmJson();

  let exam = await Exam.findOne({ where: { code: raw.exam.code } });
  if (!exam) {
    exam = await Exam.create({ code: raw.exam.code, title: raw.exam.name });
  } else if (exam.title !== raw.exam.name) {
    await exam.update({ title: raw.exam.name });
  }

  for (const rawDomain of raw.exam.domains) {
    const [domain] = await Domain.findOrCreate({
      where: { code: rawDomain.id },
      defaults: { examId: exam.id, code: rawDomain.id },
    });

    await DomainTranslation.findOrCreate({
      where: { domainId: domain.id, locale: 'en' },
      defaults: { domainId: domain.id, locale: 'en', name: rawDomain.name },
    });
    await DomainTranslation.findOrCreate({
      where: { domainId: domain.id, locale: 'fr' },
      defaults: { domainId: domain.id, locale: 'fr', name: rawDomain.name },
    });

    for (const rawObjective of rawDomain.objectives) {
      const [objective] = await Objective.findOrCreate({
        where: { code: rawObjective.id },
        defaults: { domainId: domain.id, code: rawObjective.id },
      });

      await ObjectiveTranslation.findOrCreate({
        where: { objectiveId: objective.id, locale: 'en' },
        defaults: {
          objectiveId: objective.id,
          locale: 'en',
          title: rawObjective.title,
        },
      });
      await ObjectiveTranslation.findOrCreate({
        where: { objectiveId: objective.id, locale: 'fr' },
        defaults: {
          objectiveId: objective.id,
          locale: 'fr',
          title: rawObjective.title,
        },
      });

      for (const rawSubObjective of rawObjective.sub_objectives) {
        const [subObjective] = await SubObjective.findOrCreate({
          where: { code: rawSubObjective.id },
          defaults: { objectiveId: objective.id, code: rawSubObjective.id },
        });

        await SubObjectiveTranslation.findOrCreate({
          where: { subObjectiveId: subObjective.id, locale: 'en' },
          defaults: {
            subObjectiveId: subObjective.id,
            locale: 'en',
            title: rawSubObjective.title,
          },
        });
        await SubObjectiveTranslation.findOrCreate({
          where: { subObjectiveId: subObjective.id, locale: 'fr' },
          defaults: {
            subObjectiveId: subObjective.id,
            locale: 'fr',
            title: rawSubObjective.title,
          },
        });

        for (let topicIndex = 0; topicIndex < rawSubObjective.topics.length; topicIndex += 1) {
          const topicName = rawSubObjective.topics[topicIndex];
          const topicCode = `${rawSubObjective.id}-${topicIndex + 1}`;
          const [topic] = await Topic.findOrCreate({
            where: { code: topicCode },
            defaults: { subObjectiveId: subObjective.id, code: topicCode },
          });

          await TopicTranslation.findOrCreate({
            where: { topicId: topic.id, locale: 'en' },
            defaults: { topicId: topic.id, locale: 'en', name: topicName },
          });
          await TopicTranslation.findOrCreate({
            where: { topicId: topic.id, locale: 'fr' },
            defaults: { topicId: topic.id, locale: 'fr', name: topicName },
          });
        }

        await seedSubObjectiveQuestions({
          subObjectiveId: subObjective.id,
          subObjectiveCode: rawSubObjective.id,
          subObjectiveTitle: rawSubObjective.title,
          topics: rawSubObjective.topics,
        });
      }
    }
  }
}

export { seedBaselineCatalog };
