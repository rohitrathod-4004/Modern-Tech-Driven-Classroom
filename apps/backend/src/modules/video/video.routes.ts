import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authenticate } from '../../middleware/auth.middleware';
import { createVideoRoom, getVideoRoomToken } from './video.controller';

const router = Router();

// Create a video room tied to a lecture (teacher only — enforced in controller)
router.post('/rooms', authenticate, asyncHandler(createVideoRoom));

// Get a short-lived participant token scoped to a room
router.get('/rooms/:roomId/token', authenticate, asyncHandler(getVideoRoomToken));

export default router;
