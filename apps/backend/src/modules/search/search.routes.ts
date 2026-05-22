import { Router } from 'express';
import { SearchController } from './search.controller';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 searches per minute per IP
  message: { error: 'Too many search requests, please try again later.' }
});

const router = Router();

router.use(authenticate);

router.get(
  '/',
  searchRateLimiter,
  asyncHandler(SearchController.search)
);

export default router;
