import { Request, Response } from 'express';
import { CourseService } from './course.service';

export class CourseController {
  static async create(req: Request, res: Response) {
    const teacherId = req.user!.id;
    const { title, description } = req.body;
    const course = await CourseService.createCourse(teacherId, title, description);
    res.status(201).json({ data: course });
  }

  static async update(req: Request, res: Response) {
    const teacherId = req.user!.id;
    const { courseId } = req.params;
    const course = await CourseService.updateCourse(courseId, teacherId, req.body);
    res.status(200).json({ data: course });
  }

  static async delete(req: Request, res: Response) {
    const teacherId = req.user!.id;
    const { courseId } = req.params;
    await CourseService.deleteCourse(courseId, teacherId);
    res.status(200).json({ data: { success: true } });
  }

  static async join(req: Request, res: Response) {
    const studentId = req.user!.id;
    const { enrollmentCode } = req.body;
    const course = await CourseService.joinCourse(studentId, enrollmentCode);
    res.status(200).json({ data: course });
  }

  static async list(req: Request, res: Response) {
    const userId = req.user!.id;
    const role = req.user!.role;
    const courses = await CourseService.listCourses(userId, role);
    res.status(200).json({ data: courses });
  }

  static async get(req: Request, res: Response) {
    const userId = req.user!.id;
    const role = req.user!.role;
    const { courseId } = req.params;
    const course = await CourseService.getCourse(courseId, userId, role);
    res.status(200).json({ data: course });
  }
}
