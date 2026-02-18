import dotenv from 'dotenv';

import '../../db/models/index.js';
import { seedBaselineCatalog } from '../../db/seeders/baseline.js';
import { sequelize } from '../../db/sequelize.js';

dotenv.config();

async function run(): Promise<void> {
  await sequelize.authenticate();
  await sequelize.sync();
  await seedBaselineCatalog();
  console.log('Seed completed.');
  await sequelize.close();
}

run().catch((error: unknown) => {
  console.error('Failed to seed database:', error);
  process.exit(1);
});
