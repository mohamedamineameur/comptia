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

async function seedBaselineCatalog(): Promise<void> {
  let exam = await Exam.findOne({ where: { code: 'SY0-701' } });
  if (!exam) {
    exam = await Exam.create({ code: 'SY0-701', title: 'CompTIA Security+ SY0-701' });
  }

  const [domain] = await Domain.findOrCreate({
    where: { code: '1.0' },
    defaults: { examId: exam.id, code: '1.0' },
  });

  await DomainTranslation.findOrCreate({
    where: { domainId: domain.id, locale: 'fr' },
    defaults: { domainId: domain.id, locale: 'fr', name: 'Attaques, menaces et vulnerabilites' },
  });
  await DomainTranslation.findOrCreate({
    where: { domainId: domain.id, locale: 'en' },
    defaults: { domainId: domain.id, locale: 'en', name: 'Threats, attacks and vulnerabilities' },
  });

  const [objective] = await Objective.findOrCreate({
    where: { code: '1.1' },
    defaults: { domainId: domain.id, code: '1.1' },
  });

  await ObjectiveTranslation.findOrCreate({
    where: { objectiveId: objective.id, locale: 'fr' },
    defaults: {
      objectiveId: objective.id,
      locale: 'fr',
      title: 'Comparer differents types d acteurs de menace',
    },
  });
  await ObjectiveTranslation.findOrCreate({
    where: { objectiveId: objective.id, locale: 'en' },
    defaults: {
      objectiveId: objective.id,
      locale: 'en',
      title: 'Compare and contrast different types of threat actors',
    },
  });

  const [subObjective] = await SubObjective.findOrCreate({
    where: { code: '1.1.1' },
    defaults: { objectiveId: objective.id, code: '1.1.1' },
  });

  await SubObjectiveTranslation.findOrCreate({
    where: { subObjectiveId: subObjective.id, locale: 'fr' },
    defaults: {
      subObjectiveId: subObjective.id,
      locale: 'fr',
      title: 'Identifier les motivations et techniques des acteurs',
    },
  });
  await SubObjectiveTranslation.findOrCreate({
    where: { subObjectiveId: subObjective.id, locale: 'en' },
    defaults: {
      subObjectiveId: subObjective.id,
      locale: 'en',
      title: 'Identify threat actor motivations and techniques',
    },
  });

  const [topic1] = await Topic.findOrCreate({
    where: { code: '1.1.1-A' },
    defaults: { subObjectiveId: subObjective.id, code: '1.1.1-A' },
  });
  const [topic2] = await Topic.findOrCreate({
    where: { code: '1.1.1-B' },
    defaults: { subObjectiveId: subObjective.id, code: '1.1.1-B' },
  });

  await TopicTranslation.findOrCreate({
    where: { topicId: topic1.id, locale: 'fr' },
    defaults: { topicId: topic1.id, locale: 'fr', name: 'Etats-nations et groupes APT' },
  });
  await TopicTranslation.findOrCreate({
    where: { topicId: topic1.id, locale: 'en' },
    defaults: { topicId: topic1.id, locale: 'en', name: 'Nation states and APT groups' },
  });
  await TopicTranslation.findOrCreate({
    where: { topicId: topic2.id, locale: 'fr' },
    defaults: { topicId: topic2.id, locale: 'fr', name: 'Cybercriminels motives par le gain' },
  });
  await TopicTranslation.findOrCreate({
    where: { topicId: topic2.id, locale: 'en' },
    defaults: { topicId: topic2.id, locale: 'en', name: 'Financially motivated cybercriminals' },
  });

  const [question] = await Question.findOrCreate({
    where: {
      subObjectiveId: subObjective.id,
      language: 'fr',
      difficulty: 2,
      questionText:
        'Quel acteur de menace est generalement associe a des campagnes de longue duree et tres ciblees ?',
    },
    defaults: {
      subObjectiveId: subObjective.id,
      language: 'fr',
      questionText:
        'Quel acteur de menace est generalement associe a des campagnes de longue duree et tres ciblees ?',
      explanation:
        'Les groupes APT sont connus pour des operations persistantes, ciblees et souvent financees a grande echelle.',
      difficulty: 2,
      source: 'manual',
    },
  });

  const existingChoices = await QuestionChoice.count({ where: { questionId: question.id } });
  if (existingChoices === 0) {
    await QuestionChoice.bulkCreate([
      { questionId: question.id, choiceText: 'Un groupe APT soutenu par un Etat', isCorrect: true },
      { questionId: question.id, choiceText: 'Un utilisateur interne non forme', isCorrect: false },
      { questionId: question.id, choiceText: 'Une panne materielle aleatoire', isCorrect: false },
      { questionId: question.id, choiceText: 'Une erreur DNS locale isolee', isCorrect: false },
    ]);
  }
}

export { seedBaselineCatalog };
