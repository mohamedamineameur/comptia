import { Router } from 'express';

import { requireAuth } from '../../common/middlewares/require-auth.js';
import { ProgressController } from './progress.controller.js';
import { ProgressRepository } from './progress.repo.js';
import { ProgressService } from './progress.service.js';

const progressRouter = Router();
const repo = new ProgressRepository();
const service = new ProgressService(repo);
const controller = new ProgressController(service);

progressRouter.get('/summary', requireAuth, controller.summary);
progressRouter.get('/by-domain', requireAuth, controller.byDomain);
progressRouter.get('/by-subobjective', requireAuth, controller.bySubObjective);
progressRouter.get('/daily', requireAuth, controller.daily);
progressRouter.get('/weak-areas', requireAuth, controller.weakAreas);
progressRouter.get('/next-best', requireAuth, controller.nextBest);
progressRouter.get('/dashboard', requireAuth, controller.dashboard);

export { progressRouter };
