import dotenv from 'dotenv';

import '../../db/models/index.js';
import { sequelize } from '../../db/sequelize.js';

dotenv.config();

async function run(): Promise<void> {
  await sequelize.authenticate();
  await sequelize.sync();
  // eslint-disable-next-line no-console
  console.log('Database schema synchronized.');
  await sequelize.close();
}

run().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to sync database schema:', error);
  process.exit(1);
});
