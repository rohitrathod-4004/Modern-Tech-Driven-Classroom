import { Request, Response } from 'express';
import { Lecture } from '../../models/Lecture';
import { Course } from '../../models/Course';
import { AppError } from '../../utils/AppError';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

/**
 * Creates a video-lecture room and returns the roomId.
 * The roomId is derived from the lectureId so it is deterministic and idempotent.
 *
 * POST /api/video/rooms
 * Body: { courseId, lectureId?, title? }
 */
export const createVideoRoom = async (req: Request, res: Response) => {
  const teacherId = req.user!.id;
  const { courseId, lectureId, title } = req.body;

  if (!courseId) {
    throw new AppError('courseId is required', 400);
  }

  // Validate teacher owns the course
  const course = await Course.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  if (course.teacherId.toString() !== teacherId) {
    throw new AppError('Only the course teacher can start a video lecture', 403);
  }

  // If a lectureId was supplied, reuse that lecture; otherwise create a fresh one
  let lecture;
  if (lectureId) {
    lecture = await Lecture.findById(lectureId);
    if (!lecture) throw new AppError('Lecture not found', 404);
  } else {
    // Auto-conclude any existing live lectures for this course to avoid multiple concurrent live lectures
    await Lecture.updateMany(
      { courseId, isLive: true, deletedAt: null },
      { $set: { isLive: false, endedAt: new Date(), status: 'completed' } }
    );

    lecture = await Lecture.create({
      courseId,
      teacherId,
      title: title || `Video Lecture — ${new Date().toLocaleDateString()}`,
      status: 'recording',
      isLive: true,
      isVideo: true,
      liveStartedAt: new Date(),
      startedAt: new Date(),
    });
  }

  // The roomId is the lecture's MongoDB _id (string). This is deterministic and
  // avoids a separate "rooms" collection for now.
  const roomId = lecture._id.toString();

  res.json({
    success: true,
    data: {
      roomId,
      lectureId: roomId,
      title: lecture.title,
    },
  });
};

/**
 * Issues a short-lived participant token scoped to a room.
 * The token is a signed JWT the signaling server can optionally verify.
 *
 * GET /api/video/rooms/:roomId/token
 */
export const getVideoRoomToken = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const user = req.user!;

  // Validate the lecture exists
  const lecture = await Lecture.findById(roomId).select('courseId isLive').lean();
  if (!lecture) throw new AppError('Room not found', 404);

  // Validate user is enrolled or is the teacher
  const course = await Course.findById(lecture.courseId)
    .select('teacherId students')
    .lean();

  if (!course) throw new AppError('Course not found', 404);

  const isTeacher = course.teacherId.toString() === user.id;
  const isStudent = course.students.map((s: any) => s.toString()).includes(user.id);

  if (!isTeacher && !isStudent) {
    throw new AppError('You are not enrolled in this course', 403);
  }

  // Sign a token that the signaling server can verify if needed
  const signalingToken = jwt.sign(
    {
      sub: user.id,
      roomId,
      role: user.role,
      name: user.email, // populated in VideoLectureRoom from auth store
    },
    env.JWT_SECRET,
    { expiresIn: '4h' }
  );

  res.json({
    success: true,
    data: {
      token: signalingToken,
      roomId,
      userId: user.id,
      isTeacher,
      courseId: lecture.courseId.toString(),
    },
  });
};
