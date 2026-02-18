import { Router } from 'express';

import { requireAuth } from '../../common/middlewares/require-auth.js';
import { AuthController } from './auth.controller.js';
import { AuthRepository } from './auth.repo.js';
import { AuthService } from './auth.service.js';

const authRouter = Router();
const repo = new AuthRepository();
const service = new AuthService(repo);
const controller = new AuthController(service);

authRouter.post('/register', controller.register);
authRouter.post('/login', controller.login);
authRouter.post('/logout', controller.logout);
authRouter.get('/me', requireAuth, controller.me);

export { authRouter };
