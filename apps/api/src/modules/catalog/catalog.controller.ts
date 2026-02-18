import type { Request, Response } from 'express';

import { parseLocale, parseRequiredString } from './catalog.validators.js';
import { CatalogService } from './catalog.service.js';

class CatalogController {
  constructor(private readonly service: CatalogService) {}

  getExams = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.service.getExams();
    res.json(data);
  };

  getDomains = async (req: Request, res: Response): Promise<void> => {
    const examCode = parseRequiredString(req.query.examCode, 'examCode');
    const locale = parseLocale(req.query.lang);
    const data = await this.service.getDomains(examCode, locale);
    res.json(data);
  };

  getObjectives = async (req: Request, res: Response): Promise<void> => {
    const domainCode = parseRequiredString(req.query.domainCode, 'domainCode');
    const locale = parseLocale(req.query.lang);
    const data = await this.service.getObjectives(domainCode, locale);
    res.json(data);
  };

  getSubObjectives = async (req: Request, res: Response): Promise<void> => {
    const objectiveCode = parseRequiredString(req.query.objectiveCode, 'objectiveCode');
    const locale = parseLocale(req.query.lang);
    const data = await this.service.getSubObjectives(objectiveCode, locale);
    res.json(data);
  };

  getTopics = async (req: Request, res: Response): Promise<void> => {
    const subObjectiveCode = parseRequiredString(req.query.subObjectiveCode, 'subObjectiveCode');
    const locale = parseLocale(req.query.lang);
    const data = await this.service.getTopics(subObjectiveCode, locale);
    res.json(data);
  };
}

export { CatalogController };
