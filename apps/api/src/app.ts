import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';

import { localizeError, resolveLocale } from './common/errors/error-i18n.js';
import { normalizeError } from './common/errors/normalize-error.js';
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
  const req = _req;
  const appError = normalizeError(error);
  const locale = resolveLocale(req);
  const message = localizeError(appError.code, locale);

  if (appError.status >= 500) {
    // Server logs keep technical details while client gets safe messages.
    console.error('API error:', error);
  }

  res.status(appError.status).json({
    code: appError.code,
    message,
  });
});

export { app };
