import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requireOrganizationAdmin, requireOrganizationMember } from '../../middleware/tenant.middleware';
import { AnalyticsController } from './analytics.controller';

const router = Router();

// Org Admin Only
router.get('/organization', authenticate, requireOrganizationAdmin, asyncHandler(AnalyticsController.getOrganizationAnalytics));
router.get('/organization/live-operations', authenticate, requireOrganizationAdmin, asyncHandler(AnalyticsController.getLiveOperations));

// Teacher Only
router.get('/teacher', authenticate, asyncHandler(AnalyticsController.getTeacherAnalytics));

// Student Only
router.get('/student', authenticate, asyncHandler(AnalyticsController.getStudentAnalytics));

export default router;
