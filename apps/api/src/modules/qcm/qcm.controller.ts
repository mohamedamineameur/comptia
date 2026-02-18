import type { Request, Response } from 'express';

import { QcmService } from './qcm.service.js';
import { parseCount, parseDifficulty, parseLocale, parsePositiveInt } from './qcm.validators.js';

class QcmController {
  constructor(private readonly service: QcmService) {}

  getQuestions = async (req: Request, res: Response): Promise<void> => {
    const subObjectiveId = parsePositiveInt(req.query.subObjectiveId, 'subObjectiveId');
    const lang = parseLocale(req.query.lang);
    const questions = await this.service.getQuestions(subObjectiveId, lang);
    res.json(questions);
  };

  generate = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const subObjectiveId = parsePositiveInt(req.body?.subObjectiveId, 'subObjectiveId');
    const lang = parseLocale(req.body?.lang);
    const difficulty = parseDifficulty(req.body?.difficulty);
    const count = parseCount(req.body?.count);

    const questions = await this.service.generate({
      subObjectiveId,
      lang,
      difficulty,
      count,
      userId: req.user.id,
    });

    res.status(201).json(questions);
  };

  answer = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const questionId = parsePositiveInt(req.body?.questionId, 'questionId');
    const choiceId = parsePositiveInt(req.body?.choiceId, 'choiceId');
    const timeSpentMs = req.body?.timeSpentMs ? parsePositiveInt(req.body.timeSpentMs, 'timeSpentMs') : undefined;

    const result = await this.service.answer({
      userId: req.user.id,
      questionId,
      choiceId,
      timeSpentMs,
    });
    res.json(result);
  };
}

export { QcmController };
