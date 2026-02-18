import { Router } from 'express';

import { CatalogController } from './catalog.controller.js';
import { CatalogRepository } from './catalog.repo.js';
import { CatalogService } from './catalog.service.js';

const catalogRouter = Router();
const repo = new CatalogRepository();
const service = new CatalogService(repo);
const controller = new CatalogController(service);

catalogRouter.get('/exams', controller.getExams);
catalogRouter.get('/domains', controller.getDomains);
catalogRouter.get('/objectives', controller.getObjectives);
catalogRouter.get('/sub-objectives', controller.getSubObjectives);
catalogRouter.get('/topics', controller.getTopics);

export { catalogRouter };
