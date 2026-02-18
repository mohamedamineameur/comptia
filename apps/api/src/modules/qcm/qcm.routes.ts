import { Router } from 'express';

import { requireAuth } from '../../common/middlewares/require-auth.js';
import { rateLimitPerUser } from '../../common/middlewares/rate-limit.js';
import { env } from '../../config/env.js';
import { QcmController } from './qcm.controller.js';
import { QcmRepository } from './qcm.repo.js';
import { QcmService } from './qcm.service.js';

const qcmRouter = Router();
const repo = new QcmRepository();
const service = new QcmService(repo);
const controller = new QcmController(service);

qcmRouter.get('/questions', requireAuth, controller.getQuestions);
qcmRouter.post(
  '/generate',
  requireAuth,
  rateLimitPerUser({
    windowMs: env.qcm.generateRateWindowMs,
    max: env.qcm.generateRateMax,
  }),
  controller.generate,
);
qcmRouter.post('/answer', requireAuth, controller.answer);

export { qcmRouter };
