import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { requireOrganizationAdmin, requireOrganizationMember } from '../../middleware/tenant.middleware';
import { 
  createOrganization, 
  getOrganizationDashboard, 
  createInvite, 
  acceptInvite, 
  allocateCredits 
} from './organization.controller';

const router = Router();

// Routes available to any authenticated user
router.post('/', authenticate, asyncHandler(createOrganization));
router.post('/invites/accept', authenticate, asyncHandler(acceptInvite));

// Routes requiring specific organization admin privileges
router.post('/:id/invites', authenticate, requireOrganizationAdmin, asyncHandler(createInvite));
router.post('/:id/allocate', authenticate, requireOrganizationAdmin, asyncHandler(allocateCredits));

// Routes requiring organization membership
router.get('/:id/dashboard', authenticate, requireOrganizationMember, asyncHandler(getOrganizationDashboard));

export default router;
