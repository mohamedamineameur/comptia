import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';

import { adminRouter } from './modules/admin/admin.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { catalogRouter } from './modules/catalog/catalog.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { progressRouter } from './modules/progress/progress.routes.js';
import { qcmRouter } from './modules/qcm/qcm.routes.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.get('/api', (_req, res) => {
  res.json({ message: 'Comptia API is running' });
});

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/qcm', qcmRouter);
app.use('/api/progress', progressRouter);
app.use('/api/admin', adminRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : 'Internal server error';
  const isValidationError =
    message.startsWith('Missing required query parameter') ||
    message === 'Invalid email' ||
    message === 'Email is required' ||
    message.startsWith('Password must contain') ||
    message.startsWith('Invalid ');
  const status =
    isValidationError
      ? 400
      : message === 'Daily generation quota exceeded' || message === 'Too many generation requests'
        ? 429
      : message === 'Invalid credentials' || message === 'Unauthorized'
        ? 401
      : message === 'Forbidden'
        ? 403
        : message === 'Email already used'
          ? 409
          : message === 'Question not found' || message === 'Sub-objective not found'
            ? 404
            : message.startsWith('OpenAI')
              ? 502
            : 500;
  res.status(status).json({ message });
});

export { app };
