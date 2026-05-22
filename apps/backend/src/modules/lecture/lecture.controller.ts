import { Request, Response } from 'express';
import { LectureService } from './lecture.service';

export class LectureController {
  static async start(req: Request, res: Response) {
    let { courseId } = req.params;
    const { title } = req.body;
    const teacherId = req.user!.id; // Guaranteed by `authenticate` and `authorize('teacher')`

    // Fallback logic for the demo: if frontend sends the hardcoded ID, grab the actual course
    if (courseId === '640b1b1b1b1b1b1b1b1b1b1b') {
      const { Course } = await import('../../models/Course');
      const actualCourse = await Course.findOne({ teacherId, deletedAt: null }).lean();
      if (actualCourse) {
        courseId = actualCourse._id.toString();
      }
    }

    const lecture = await LectureService.startLecture(courseId, teacherId, title);

    res.status(201).json({
      data: lecture
    });
  }

  static async end(req: Request, res: Response) {
    const { lectureId } = req.params;
    const teacherId = req.user!.id;

    const lecture = await LectureService.endLecture(lectureId, teacherId);

    res.status(200).json({
      data: lecture
    });
  }

  static async get(req: Request, res: Response) {
    const { courseId, lectureId } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const data = await LectureService.getLecture(courseId, lectureId, userId, role);

    res.status(200).json({
      data
    });
  }

  static async list(req: Request, res: Response) {
    let { courseId } = req.params;
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

    // Fallback logic for the demo
    if (courseId === '640b1b1b1b1b1b1b1b1b1b1b') {
      const { Course } = await import('../../models/Course');
      const actualCourse = await Course.findOne({ teacherId: userId, deletedAt: null }).lean();
      if (actualCourse) {
        courseId = actualCourse._id.toString();
      }
    }

    const data = await LectureService.listLectures(courseId, userId, limit);

    res.status(200).json({
      data
    });
  }

  static async getTimeline(req: Request, res: Response) {
    const { courseId, lectureId } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;
    const cursor = req.query.cursor ? parseInt(req.query.cursor as string, 10) : -1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 2000;

    const data = await LectureService.getTimeline(courseId, lectureId, userId, role, cursor, limit);

    res.status(200).json({
      data
    });
  }
}
