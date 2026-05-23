import { Course } from '../../models/Course';
import { Lecture } from '../../models/Lecture';
import { TranscriptChunk } from '../../models/TranscriptChunk';
import { AppError } from '../../utils/AppError';
import { ErrorCodes, PaginatedTimelineResponse, TranscriptTimelineNode } from '@classroom/shared';
import { enqueueLectureProcessing } from '../../infrastructure/queue/jobs/lectureProcessing.job';
import { User } from '../../models/User';
import { WalletService } from '../wallet/wallet.service';
import { concatenateAudioChunks } from '../../utils/ffmpeg';
import path from 'path';
import fs from 'fs';

export class LectureService {
  /**
   * Creates a new lecture inside a course, setting status to 'recording'.
   */
  static async startLecture(courseId: string, teacherId: string, title: string) {
    // Validate course exists and belongs to this teacher
    const course = await Course.findOne({ _id: courseId, teacherId, deletedAt: null }).lean();
    if (!course) {
      throw new AppError('Course not found or unauthorized', 404, ErrorCodes.NOT_FOUND);
    }

    // Pre-Lecture Credit Enforcement
    const teacher = await User.findById(teacherId).select('walletId').lean();
    if (!teacher || !teacher.walletId) {
      throw new AppError('Wallet not found. Please contact support.', 400);
    }

    const hasEnoughCredits = await WalletService.checkMinimumBalance(teacher.walletId.toString(), 5);
    if (!hasEnoughCredits) {
      throw new AppError('Insufficient AI credits to start a lecture.', 402);
    }

    // Auto-conclude any existing live lectures for this course to avoid multiple concurrent live lectures
    await Lecture.updateMany(
      { courseId, isLive: true, deletedAt: null },
      { $set: { isLive: false, endedAt: new Date(), status: 'completed' } }
    );

    const lecture = await Lecture.create({
      courseId,
      teacherId,
      title,
      status: 'recording',
      startedAt: new Date(),
      chunkCount: 0,
      isLive: true,
      liveStartedAt: new Date()
    });

    return lecture;
  }

  /**
   * Validates if an upload chunk can be accepted for a given lecture.
   * Uses .lean() and .select() for ultra-low latency.
   */
  static async validateLectureUpload(lectureId: string, teacherId: string) {
    const lecture = await Lecture.findById(lectureId).select('teacherId status').lean();
    
    if (!lecture) {
      throw new AppError('Lecture not found', 404, ErrorCodes.NOT_FOUND);
    }
    
    if (lecture.teacherId.toString() !== teacherId) {
      throw new AppError('Unauthorized access to lecture', 403, ErrorCodes.FORBIDDEN);
    }

    if (lecture.status !== 'recording') {
      throw new AppError('Lecture is not in recording state', 400, 'INVALID_STATE');
    }

    return true;
  }

  /**
   * Updates lightweight upload metrics on the lecture document.
   */
  static async recordChunkMetrics(lectureId: string, latencyMs?: number) {
    const updatePayload: any = {
      $inc: { chunkCount: 1 },
      $set: { latestChunkReceivedAt: new Date() }
    };
    
    // Future-proofing: If we want to track average latency, we can use a moving average, 
    // but for now we simply store the latest processingLatencyMs.
    if (latencyMs !== undefined) {
      updatePayload.$set.processingLatencyMs = latencyMs;
    }

    await Lecture.updateOne({ _id: lectureId }, updatePayload);
  }

  /**
   * Finalizes a lecture, transitioning it from 'recording' to 'processing'.
   */
  static async endLecture(lectureId: string, teacherId: string) {
    const lecture = await Lecture.findOne({ _id: lectureId, teacherId, deletedAt: null });
    if (!lecture) {
      throw new AppError('Lecture not found or unauthorized', 404, ErrorCodes.NOT_FOUND);
    }

    // Strict State Guard: recording -> processing ONLY
    if (lecture.status !== 'recording') {
      throw new AppError(`Cannot end lecture from state: ${lecture.status}`, 400, 'INVALID_STATE_TRANSITION');
    }

    const teacher = await User.findById(teacherId).select('walletId organizationId').lean();
    if (!teacher || !teacher.walletId) {
      throw new AppError('Wallet not found for teacher', 400);
    }

    const now = new Date();
    const durationSeconds = Math.max(0, Math.floor((now.getTime() - lecture.startedAt.getTime()) / 1000));
    
    // Deduct Credits: 1 credit per minute (minimum 1 credit)
    const creditsToDeduct = Math.max(1, Math.ceil(durationSeconds / 60));
    await WalletService.deductLectureCredits(
      teacher.walletId.toString(),
      creditsToDeduct,
      durationSeconds,
      lecture._id.toString(),
      teacherId,
      teacher.organizationId?.toString()
    );

    lecture.status = 'ai_processing';
    lecture.endedAt = now;
    lecture.processingStartedAt = now;
    lecture.durationSeconds = durationSeconds;
    lecture.isLive = false;
    lecture.liveEndedAt = now;
    await lecture.save();
    
    // Concatenate saved audio chunks into a single lecture audio file (non-blocking)
    const lId = lecture._id.toString();
    const chunkDir = path.join(__dirname, '../../../uploads/lectures', lId, 'chunks');
    const outputPath = path.join(__dirname, '../../../uploads/lectures', lId, 'audio.webm');
    
    if (fs.existsSync(chunkDir)) {
      const chunkFiles = fs.readdirSync(chunkDir)
        .filter(f => f.endsWith('.wav'))
        .sort() // chunk_00000.wav, chunk_00001.wav, etc.
        .map(f => path.join(chunkDir, f));

      if (chunkFiles.length > 0) {
        // Run in background — don't block the HTTP response
        concatenateAudioChunks(chunkFiles, outputPath)
          .then(() => {
            const relativePath = `/uploads/lectures/${lId}/audio.webm`;
            return Lecture.updateOne({ _id: lecture._id }, { audioStoragePath: relativePath });
          })
          .then(() => console.log(`[Audio] Lecture ${lId} audio assembled and stored.`))
          .catch(err => console.error(`[Audio] Failed to concatenate audio for ${lId}:`, err.message));
      }
    }
    
    // Push the job to the BullMQ Redis queue
    await enqueueLectureProcessing(lId);
    
    return lecture;
  }

  /**
   * Helper method to validate access to a lecture
   */
  private static async validateLectureAccess(courseId: string, lectureId: string, userId: string, role: string) {
    const course = await Course.findOne({ _id: courseId, deletedAt: null }).lean();
    if (!course) throw new AppError('Course not found', 404, ErrorCodes.NOT_FOUND);

    // Strict Access Control
    if (role === 'teacher') {
      if (course.teacherId.toString() !== userId) {
        throw new AppError('Unauthorized: Not the course teacher', 403, ErrorCodes.FORBIDDEN);
      }
    } else if (role === 'student') {
      const isEnrolled = course.students.some(id => id.toString() === userId);
      if (!isEnrolled) {
        throw new AppError('Unauthorized: Not enrolled in this course', 403, ErrorCodes.FORBIDDEN);
      }
    }

    const lecture = await Lecture.findOne({ _id: lectureId, courseId, deletedAt: null }).lean();
    if (!lecture) throw new AppError('Lecture not found', 404, ErrorCodes.NOT_FOUND);

    return { course, lecture };
  }

  /**
   * Fetches a lecture and its transcript chunks, validating course enrollment.
   */
  static async getLecture(courseId: string, lectureId: string, userId: string, role: string) {
    const { lecture } = await this.validateLectureAccess(courseId, lectureId, userId, role);

    // Fetch chunks sorted by index
    const chunks = await TranscriptChunk.find({ lectureId })
      .sort({ chunk_index: 1 })
      .lean();

    return { lecture, chunks };
  }

  /**
   * Fetches recent lectures for a course, validating course enrollment.
   */
  static async listLectures(courseId: string, userId: string, role: string, limit: number) {
    const course = await Course.findOne({ _id: courseId, deletedAt: null }).lean();
    if (!course) throw new AppError('Course not found', 404, ErrorCodes.NOT_FOUND);

    if (role === 'teacher') {
      if (course.teacherId.toString() !== userId) {
        throw new AppError('Unauthorized: Not the course teacher', 403, ErrorCodes.FORBIDDEN);
      }
    } else if (role === 'student') {
      const isEnrolled = course.students.some(id => id.toString() === userId);
      if (!isEnrolled) {
        throw new AppError('Unauthorized: Not enrolled in this course', 403, ErrorCodes.FORBIDDEN);
      }
    }

    const lectures = await Lecture.find({ courseId, deletedAt: null })
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();
    return lectures;
  }

  /**
   * Fetches the active live lecture for a course, if any.
   */
  static async getLiveStatus(courseId: string, userId: string, role: string) {
    const course = await Course.findOne({ _id: courseId, deletedAt: null }).lean();
    if (!course) throw new AppError('Course not found', 404, ErrorCodes.NOT_FOUND);

    if (role === 'teacher') {
      if (course.teacherId.toString() !== userId) {
        throw new AppError('Unauthorized: Not the course teacher', 403, ErrorCodes.FORBIDDEN);
      }
    } else if (role === 'student') {
      const isEnrolled = course.students.some(id => id.toString() === userId);
      if (!isEnrolled) {
        throw new AppError('Unauthorized: Not enrolled in this course', 403, ErrorCodes.FORBIDDEN);
      }
    }

    const liveLecture = await Lecture.findOne({ courseId, isLive: true, deletedAt: null })
      .select('_id title startedAt liveStartedAt teacherId status isVideo')
      .lean();

    return liveLecture || null;
  }

  /**
   * Fetches the paginated canonical timeline for a lecture.
   * Computes absoluteStartTime ensuring mathematically uncorrupted chronological order.
   */
  static async getTimeline(
    courseId: string,
    lectureId: string,
    userId: string,
    role: string,
    cursor: number = -1,
    limit: number = 2000
  ): Promise<PaginatedTimelineResponse> {
    const { lecture } = await this.validateLectureAccess(courseId, lectureId, userId, role);

    // Cursor pagination optimized by chunk_index
    const chunks = await TranscriptChunk.find({
      lectureId,
      chunk_index: { $gt: cursor }
    })
      .sort({ chunk_index: 1 })
      .limit(limit)
      .lean();

    const nodes: TranscriptTimelineNode[] = chunks.map(chunk => {
      // Whisper segments within a chunk start at ~0s relative to the slice.
      // E.g., chunk_index 0 -> absolute=0, chunk_index 1 -> absolute=3.
      const chunkOffset = chunk.chunk_index * 3;
      const absoluteStartTime = chunkOffset + (chunk.start_time || 0);
      const absoluteEndTime = chunkOffset + (chunk.end_time || 0);

      return {
        id: chunk._id.toString(),
        type: 'transcript',
        text: chunk.text,
        chunkIndex: chunk.chunk_index,
        absoluteStartTime,
        absoluteEndTime,
        confidenceScore: chunk.confidenceScore
      };
    });

    const hasMore = chunks.length === limit;
    const nextCursor = hasMore ? chunks[chunks.length - 1].chunk_index : null;

    return {
      nodes,
      nextCursor,
      hasMore,
      totalChunks: lecture.chunkCount
    };
  }

  /**
   * Fetches only the latest transcript chunks for a live lecture.
   * Ensures high performance using .lean() and respects course authorization.
   */
  static async getLiveChunks(courseId: string, lectureId: string, userId: string, role: string, afterSequence: number) {
    await this.validateLectureAccess(courseId, lectureId, userId, role);

    const chunks = await TranscriptChunk.find({
      lectureId,
      chunk_index: { $gt: afterSequence }
    })
      .sort({ chunk_index: 1 })
      .limit(50) // Safe batch size
      .lean();

    const nodes: TranscriptTimelineNode[] = chunks.map(chunk => {
      const chunkOffset = chunk.chunk_index * 3;
      const absoluteStartTime = chunkOffset + (chunk.start_time || 0);
      const absoluteEndTime = chunkOffset + (chunk.end_time || 0);

      return {
        id: chunk._id.toString(),
        type: 'transcript',
        text: chunk.text,
        chunkIndex: chunk.chunk_index,
        absoluteStartTime,
        absoluteEndTime,
        confidenceScore: chunk.confidenceScore
      };
    });

    return nodes;
  }
}
