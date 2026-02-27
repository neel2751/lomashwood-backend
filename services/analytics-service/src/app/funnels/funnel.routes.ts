import { Router, type IRouter } from 'express';

import { FunnelController } from './funnel.controller';
import { FUNNEL_ROUTES } from './funnel.constants';

const router: IRouter = Router();
const controller = new FunnelController();

router.post(FUNNEL_ROUTES.BASE, (req, res, next) => controller.create(req, res, next));
router.get(FUNNEL_ROUTES.BASE, (req, res, next) => controller.list(req, res, next));
router.get(FUNNEL_ROUTES.BY_ID, (req, res, next) => controller.getById(req, res, next));
router.patch(FUNNEL_ROUTES.BY_ID, (req, res, next) => controller.update(req, res, next));
router.post(FUNNEL_ROUTES.COMPUTE, (req, res, next) => controller.compute(req, res, next));
router.get(FUNNEL_ROUTES.RESULTS, (req, res, next) => controller.getResults(req, res, next));
router.patch(FUNNEL_ROUTES.PAUSE, (req, res, next) => controller.pause(req, res, next));
router.patch(FUNNEL_ROUTES.RESUME, (req, res, next) => controller.resume(req, res, next));
router.delete(FUNNEL_ROUTES.ARCHIVE, (req, res, next) => controller.archive(req, res, next));

export { router as funnelRouter };