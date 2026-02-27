import { Router, type IRouter } from 'express';

import { DashboardController } from './dashboard.controller';
import { DASHBOARD_ROUTES } from './dashboard.constants';

const router: IRouter = Router();
const controller = new DashboardController();

router.post(DASHBOARD_ROUTES.BASE, (req, res, next) => controller.create(req, res, next));
router.get(DASHBOARD_ROUTES.BASE, (req, res, next) => controller.list(req, res, next));
router.get(DASHBOARD_ROUTES.DEFAULT, (req, res, next) => controller.getDefault(req, res, next));
router.get(DASHBOARD_ROUTES.BY_ID, (req, res, next) => controller.getById(req, res, next));
router.patch(DASHBOARD_ROUTES.BY_ID, (req, res, next) => controller.update(req, res, next));
router.delete(DASHBOARD_ROUTES.BY_ID, (req, res, next) => controller.delete(req, res, next));
router.patch(DASHBOARD_ROUTES.SET_DEFAULT, (req, res, next) => controller.setDefault(req, res, next));
router.get(DASHBOARD_ROUTES.REFRESH, (req, res, next) => controller.refresh(req, res, next));
router.post(DASHBOARD_ROUTES.WIDGETS, (req, res, next) => controller.addWidget(req, res, next));
router.patch(DASHBOARD_ROUTES.WIDGET_BY_ID, (req, res, next) => controller.updateWidget(req, res, next));
router.delete(DASHBOARD_ROUTES.WIDGET_BY_ID, (req, res, next) => controller.removeWidget(req, res, next));

export { router as dashboardRouter };