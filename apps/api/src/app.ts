import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';

import { authRouter } from './modules/auth/auth.routes.js';
import { catalogRouter } from './modules/catalog/catalog.routes.js';
import { healthRouter } from './modules/health/health.routes.js';

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

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : 'Internal server error';
  const isValidationError =
    message.startsWith('Missing required query parameter') ||
    message === 'Invalid email' ||
    message === 'Email is required' ||
    message.startsWith('Password must contain');
  const status = isValidationError ? 400 : message === 'Invalid credentials' ? 401 : message === 'Email already used' ? 409 : 500;
  res.status(status).json({ message });
});

export { app };
