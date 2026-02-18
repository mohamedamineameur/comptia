import dotenv from 'dotenv';

import {
  Domain,
  DomainTranslation,
  Exam,
  Objective,
  ObjectiveTranslation,
  SubObjective,
  SubObjectiveTranslation,
  Topic,
  TopicTranslation,
} from '../../db/models/index.js';
import { sequelize } from '../../db/sequelize.js';

dotenv.config();

async function seedCatalog(): Promise<void> {
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
}

async function run(): Promise<void> {
  await sequelize.authenticate();
  await sequelize.sync();
  await seedCatalog();
  // eslint-disable-next-line no-console
  console.log('Seed completed.');
  await sequelize.close();
}

run().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to seed database:', error);
  process.exit(1);
});
