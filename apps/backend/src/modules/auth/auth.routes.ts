import { Router } from 'express';
import { AuthController } from './auth.controller';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authRateLimiter } from '../../middleware/rateLimit.middleware';
import { RegisterSchema, LoginSchema } from '@classroom/shared';

const router = Router();

router.post(
  '/register',
  authRateLimiter,
  validate({ body: RegisterSchema }),
  asyncHandler(AuthController.register)
);

router.post(
  '/login',
  authRateLimiter,
  validate({ body: LoginSchema }),
  asyncHandler(AuthController.login)
);

router.post(
  '/refresh',
  authRateLimiter,
  asyncHandler(AuthController.refresh)
);

router.post(
  '/logout',
  asyncHandler(AuthController.logout)
);

router.get(
  '/me',
  authenticate,
  asyncHandler(AuthController.me)
);

export default router;
