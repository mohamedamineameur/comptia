import { Router } from 'express';

import { requireAdmin } from '../../common/middlewares/require-admin.js';
import { requireAuth } from '../../common/middlewares/require-auth.js';
import { AdminController } from './admin.controller.js';
import { AdminRepository } from './admin.repo.js';
import { AdminService } from './admin.service.js';

const adminRouter = Router();
const repo = new AdminRepository();
const service = new AdminService(repo);
const controller = new AdminController(service);

adminRouter.use(requireAuth, requireAdmin);
adminRouter.get('/status', controller.status);
adminRouter.post('/seed', controller.seed);
adminRouter.post('/qcm/manual', controller.createManualQuestion);

export { adminRouter };
