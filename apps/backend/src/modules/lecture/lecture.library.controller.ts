import { Request, Response } from 'express';
import { Lecture } from '../../models/Lecture';
import { Course } from '../../models/Course';

export class LectureLibraryController {
  static async getAllLectures(req: Request, res: Response) {
    const userId = req.user!.id;
    const role = req.user!.role;
    
    // Filters and sorting
    const courseIdFilter = req.query.courseId as string;
    const sortOrder = req.query.sort === 'asc' ? 1 : -1;
    
    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // 1. Get user's course IDs
    let allowedCourseIds: any[] = [];
    if (role === 'teacher') {
      const courses = await Course.find({ teacherId: userId, deletedAt: null }).lean();
      allowedCourseIds = courses.map(c => c._id);
    } else {
      const courses = await Course.find({ students: userId, deletedAt: null }).lean();
      allowedCourseIds = courses.map(c => c._id);
    }

    if (allowedCourseIds.length === 0) {
      return res.status(200).json({ data: [], total: 0, page, limit });
    }

    // 2. Build query
    const query: any = { 
      courseId: { $in: allowedCourseIds },
      deletedAt: null 
    };

    if (courseIdFilter && allowedCourseIds.map(id => id.toString()).includes(courseIdFilter)) {
      query.courseId = courseIdFilter;
    }

    // 3. Execute paginated lean query
    const [lectures, total] = await Promise.all([
      Lecture.find(query)
        .sort({ startedAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Lecture.countDocuments(query)
    ]);

    // Map to DTOs
    const formattedLectures = lectures.map(lec => ({
      id: lec._id,
      title: lec.title,
      courseId: lec.courseId,
      status: lec.status,
      startedAt: lec.startedAt,
      durationSeconds: lec.durationSeconds,
      summary: lec.summary?.short
    }));

    res.status(200).json({
      data: formattedLectures,
      total,
      page,
      limit
    });
  }
}
