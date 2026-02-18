import {
  Domain,
  Exam,
  Objective,
  Question,
  QuestionChoice,
  SubObjective,
  Topic,
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

async function loadJsonByCandidates(candidates: string[]): Promise<string | null> {
  for (const candidate of candidates) {
    try {
      return await readFile(candidate, 'utf-8');
    } catch {
      // try next candidate path
    }
  }
  return null;
}

function parseExamJson(content: string, sourceLabel: string): RawExamFile {
  const parsed = JSON.parse(content) as RawExamFile;
  if (!parsed?.exam?.code || !Array.isArray(parsed?.exam?.domains)) {
    throw new Error(`${sourceLabel} has invalid structure`);
  }
  return parsed;
}

async function loadSeedSources(): Promise<{ base: RawExamFile; fr: RawExamFile | null }> {
  const candidates = [
    path.resolve(process.cwd(), 'qcm.json'),
    path.resolve(process.cwd(), '../../qcm.json'),
  ];
  const frCandidates = [
    path.resolve(process.cwd(), 'qcm.fr.json'),
    path.resolve(process.cwd(), 'qcm_fr.json'),
    path.resolve(process.cwd(), '../../qcm.fr.json'),
    path.resolve(process.cwd(), '../../qcm_fr.json'),
  ];

  const baseContent = await loadJsonByCandidates(candidates);
  if (!baseContent) {
    throw new Error('qcm.json not found at expected locations');
  }
  const base = parseExamJson(baseContent, 'qcm.json');

  const frContent = await loadJsonByCandidates(frCandidates);
  if (!frContent) {
    return { base, fr: null };
  }
  const fr = parseExamJson(frContent, 'qcm.fr.json');
  if (fr.exam.code !== base.exam.code) {
    throw new Error('qcm.fr.json exam.code must match qcm.json exam.code');
  }
  return { base, fr };
}

function findDomainById(file: RawExamFile, domainId: string): RawDomain | null {
  return file.exam.domains.find((domain) => domain.id === domainId) ?? null;
}

function findObjectiveById(domain: RawDomain | null, objectiveId: string): RawObjective | null {
  if (!domain) {
    return null;
  }
  return domain.objectives.find((objective) => objective.id === objectiveId) ?? null;
}

function findSubObjectiveById(objective: RawObjective | null, subObjectiveId: string): RawSubObjective | null {
  if (!objective) {
    return null;
  }
  return objective.sub_objectives.find((subObjective) => subObjective.id === subObjectiveId) ?? null;
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
  subObjectiveTitleEn: string;
  subObjectiveTitleFr: string;
  topicsEn: string[];
  topicsFr: string[];
}): Promise<void> {
  const baseTopicsEn = input.topicsEn.length > 0 ? input.topicsEn : ['Core concept'];
  const baseTopicsFr = input.topicsFr.length > 0 ? input.topicsFr : baseTopicsEn;

  for (let topicIndex = 0; topicIndex < baseTopicsEn.length; topicIndex += 1) {
    const topicEn = baseTopicsEn[topicIndex];
    const topicFr = baseTopicsFr[topicIndex] ?? topicEn;
    const distractorsEn = uniqueDistractors(baseTopicsEn, topicEn);
    const distractorsFr = uniqueDistractors(baseTopicsFr, topicFr);

    const englishQuestionText = `Which item is explicitly part of "${input.subObjectiveTitleEn}"?`;
    const frenchQuestionText = `Quel element fait explicitement partie de "${input.subObjectiveTitleFr}" ?`;
    const [question] = await Question.findOrCreate({
      where: {
        subObjectiveId: input.subObjectiveId,
        language: 'bi',
        difficulty: 2,
        questionTextEn: `${englishQuestionText} (${topicEn})`,
      },
      defaults: {
        subObjectiveId: input.subObjectiveId,
        language: 'bi',
        difficulty: 2,
        questionText: `${englishQuestionText} (${topicEn})`,
        questionTextEn: `${englishQuestionText} (${topicEn})`,
        questionTextFr: `${frenchQuestionText} (${topicFr})`,
        explanation: `"${topicEn}" is listed in the topics for sub-objective ${input.subObjectiveCode}.`,
        explanationEn: `"${topicEn}" is listed in the topics for sub-objective ${input.subObjectiveCode}.`,
        explanationFr: `"${topicFr}" fait partie des topics du sous-objectif ${input.subObjectiveCode}.`,
        source: 'manual',
      },
    });

    const choicesCount = await QuestionChoice.count({ where: { questionId: question.id } });
    if (choicesCount === 0) {
      await QuestionChoice.bulkCreate([
        {
          questionId: question.id,
          choiceText: topicEn,
          choiceTextEn: topicEn,
          choiceTextFr: topicFr,
          isCorrect: true,
        },
        {
          questionId: question.id,
          choiceText: distractorsEn[0],
          choiceTextEn: distractorsEn[0],
          choiceTextFr: distractorsFr[0],
          isCorrect: false,
        },
        {
          questionId: question.id,
          choiceText: distractorsEn[1],
          choiceTextEn: distractorsEn[1],
          choiceTextFr: distractorsFr[1],
          isCorrect: false,
        },
        {
          questionId: question.id,
          choiceText: distractorsEn[2],
          choiceTextEn: distractorsEn[2],
          choiceTextFr: distractorsFr[2],
          isCorrect: false,
        },
      ]);
    }
  }
}

async function seedBaselineCatalog(): Promise<void> {
  const { base: raw, fr: rawFr } = await loadSeedSources();

  let exam = await Exam.findOne({ where: { code: raw.exam.code } });
  if (!exam) {
    exam = await Exam.create({ code: raw.exam.code, title: raw.exam.name });
  } else if (exam.title !== raw.exam.name) {
    await exam.update({ title: raw.exam.name });
  }

  for (const rawDomain of raw.exam.domains) {
    const frDomain = rawFr ? findDomainById(rawFr, rawDomain.id) : null;
    const [domain] = await Domain.findOrCreate({
      where: { code: rawDomain.id },
      defaults: {
        examId: exam.id,
        code: rawDomain.id,
        nameEn: rawDomain.name,
        nameFr: frDomain?.name ?? rawDomain.name,
      },
    });
    await domain.update({
      nameEn: rawDomain.name,
      nameFr: frDomain?.name ?? rawDomain.name,
    });

    for (const rawObjective of rawDomain.objectives) {
      const frObjective = rawFr
        ? findObjectiveById(findDomainById(rawFr, rawDomain.id), rawObjective.id)
        : null;
      const [objective] = await Objective.findOrCreate({
        where: { code: rawObjective.id },
        defaults: {
          domainId: domain.id,
          code: rawObjective.id,
          titleEn: rawObjective.title,
          titleFr: frObjective?.title ?? rawObjective.title,
        },
      });
      await objective.update({
        titleEn: rawObjective.title,
        titleFr: frObjective?.title ?? rawObjective.title,
      });

      for (const rawSubObjective of rawObjective.sub_objectives) {
        const frSubObjective = rawFr
          ? findSubObjectiveById(frObjective, rawSubObjective.id)
          : null;
        const [subObjective] = await SubObjective.findOrCreate({
          where: { code: rawSubObjective.id },
          defaults: {
            objectiveId: objective.id,
            code: rawSubObjective.id,
            titleEn: rawSubObjective.title,
            titleFr: frSubObjective?.title ?? rawSubObjective.title,
          },
        });
        await subObjective.update({
          titleEn: rawSubObjective.title,
          titleFr: frSubObjective?.title ?? rawSubObjective.title,
        });

        for (let topicIndex = 0; topicIndex < rawSubObjective.topics.length; topicIndex += 1) {
          const topicName = rawSubObjective.topics[topicIndex];
          const topicCode = `${rawSubObjective.id}-${topicIndex + 1}`;
          const [topic] = await Topic.findOrCreate({
            where: { code: topicCode },
            defaults: {
              subObjectiveId: subObjective.id,
              code: topicCode,
              nameEn: topicName,
              nameFr: frSubObjective?.topics[topicIndex] ?? topicName,
            },
          });
          const frTopicName = frSubObjective?.topics[topicIndex] ?? topicName;
          await topic.update({
            nameEn: topicName,
            nameFr: frTopicName,
          });

        }

        await seedSubObjectiveQuestions({
          subObjectiveId: subObjective.id,
          subObjectiveCode: rawSubObjective.id,
          subObjectiveTitleEn: rawSubObjective.title,
          subObjectiveTitleFr: frSubObjective?.title ?? rawSubObjective.title,
          topicsEn: rawSubObjective.topics,
          topicsFr: frSubObjective?.topics ?? rawSubObjective.topics,
        });
      }
    }
  }
}

export { seedBaselineCatalog };
