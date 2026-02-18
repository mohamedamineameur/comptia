import type { Request, Response } from 'express';

import { parseManualQuestionBody } from './admin.validators.js';
import { AdminService } from './admin.service.js';

class AdminController {
  constructor(private readonly service: AdminService) {}

  status = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.service.getStatus();
    res.json(data);
  };

  seed = async (_req: Request, res: Response): Promise<void> => {
    const data = await this.service.seedBaseline();
    res.status(201).json(data);
  };

  createManualQuestion = async (req: Request, res: Response): Promise<void> => {
    const payload = parseManualQuestionBody(req.body);
    const created = await this.service.createManualQuestion(payload);
    res.status(201).json(created);
  };
}

export { AdminController };
