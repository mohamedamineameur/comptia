import dotenv from 'dotenv';

import { app } from './app.js';
import { env } from './config/env.js';
import './db/models/index.js';
import { sequelize } from './db/sequelize.js';

dotenv.config();

async function bootstrap(): Promise<void> {
  await sequelize.authenticate();
  await sequelize.sync();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start API:', error);
  process.exit(1);
});
