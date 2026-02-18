import type { Request, Response } from 'express';

import { parseLocale } from '../qcm/qcm.validators.js';
import { ProgressService } from './progress.service.js';

class ProgressController {
  constructor(private readonly service: ProgressService) {}

  summary = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const data = await this.service.getSummary(req.user.id);
    res.json(data);
  };

  byDomain = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const locale = parseLocale(req.query.lang);
    const data = await this.service.getByDomain(req.user.id, locale);
    res.json(data);
  };

  bySubObjective = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const locale = parseLocale(req.query.lang);
    const data = await this.service.getBySubObjective(req.user.id, locale);
    res.json(data);
  };

  daily = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const data = await this.service.getDailyStats(req.user.id);
    res.json(data);
  };

  weakAreas = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const locale = parseLocale(req.query.lang);
    const data = await this.service.getWeakAreas(req.user.id, locale);
    res.json(data);
  };

  nextBest = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const locale = parseLocale(req.query.lang);
    const data = await this.service.getNextBest(req.user.id, locale);
    res.json(data);
  };

  dashboard = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const locale = parseLocale(req.query.lang);
    const data = await this.service.getDashboard(req.user.id, locale);
    res.json(data);
  };
}

export { ProgressController };
