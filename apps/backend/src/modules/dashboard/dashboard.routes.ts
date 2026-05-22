import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get(
  '/stats',
  asyncHandler(DashboardController.getStats)
);

router.get(
  '/recent-lectures',
  asyncHandler(DashboardController.getRecentLectures)
);

export default router;
