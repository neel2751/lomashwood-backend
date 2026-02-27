import { Router, type IRouter } from 'express';

import { ExportController } from './export.controller';
import { EXPORT_ROUTES } from './export.constants';

const router: IRouter = Router();
const controller = new ExportController();

router.post(EXPORT_ROUTES.BASE, (req, res, next) => controller.create(req, res, next));
router.get(EXPORT_ROUTES.BASE, (req, res, next) => controller.list(req, res, next));
router.get(EXPORT_ROUTES.BY_ID, (req, res, next) => controller.getById(req, res, next));
router.get(EXPORT_ROUTES.DOWNLOAD, (req, res, next) => controller.download(req, res, next));
router.patch(EXPORT_ROUTES.CANCEL, (req, res, next) => controller.cancel(req, res, next));
router.post(EXPORT_ROUTES.RETRY, (req, res, next) => controller.retry(req, res, next));

export { router as exportRouter };