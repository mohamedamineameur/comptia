import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';

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

app.get('/api', (_req, res) => {
  res.json({ message: 'Comptia API is running' });
});

app.use('/api/health', healthRouter);
app.use('/api/catalog', catalogRouter);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : 'Internal server error';
  const status = message.startsWith('Missing required query parameter') ? 400 : 500;
  res.status(status).json({ message });
});

export { app };
