import { Course, ICourseDocument } from '../../models/Course';
import { User } from '../../models/User';
import { AppError } from '../../utils/AppError';
import { ErrorCodes } from '@classroom/shared';
import crypto from 'crypto';

export class CourseService {
  private static toDto(course: ICourseDocument) {
    return {
      id: course._id.toString(),
      title: course.title,
      description: course.description,
      teacherId: course.teacherId.toString(),
      enrollmentCode: course.enrollmentCode,
      students: course.students.map(s => s.toString()),
      isActive: course.isActive,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
    };
  }

  static async createCourse(teacherId: string, title: string, description?: string) {
    const enrollmentCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const course = await Course.create({
      title,
      description,
      teacherId,
      enrollmentCode,
      students: []
    });

    // Add to teacher's enrolled courses (for dashboard tracking)
    await User.findByIdAndUpdate(teacherId, { $addToSet: { enrolledCourses: course._id } });

    return this.toDto(course as ICourseDocument);
  }

  static async updateCourse(courseId: string, teacherId: string, updates: { title?: string; description?: string; isActive?: boolean }) {
    const course = await Course.findOneAndUpdate(
      { _id: courseId, teacherId, deletedAt: null },
      { $set: updates },
      { new: true }
    );

    if (!course) throw new AppError('Course not found or unauthorized', 404, ErrorCodes.NOT_FOUND);
    return this.toDto(course);
  }

  static async deleteCourse(courseId: string, teacherId: string) {
    const course = await Course.findOneAndUpdate(
      { _id: courseId, teacherId, deletedAt: null },
      { $set: { deletedAt: new Date(), isActive: false } },
      { new: true }
    );

    if (!course) throw new AppError('Course not found or unauthorized', 404, ErrorCodes.NOT_FOUND);
    
    // Remove from all users' enrolled courses
    await User.updateMany({ enrolledCourses: courseId }, { $pull: { enrolledCourses: courseId } });
    
    return { success: true };
  }

  static async joinCourse(studentId: string, enrollmentCode: string) {
    const course = await Course.findOne({ enrollmentCode, isActive: true, deletedAt: null });
    if (!course) throw new AppError('Invalid enrollment code or course is inactive', 404, ErrorCodes.NOT_FOUND);

    if (course.students.some(id => id.toString() === studentId)) {
      throw new AppError('Already enrolled in this course', 400, ErrorCodes.VALIDATION_ERROR);
    }

    course.students.push(studentId as any);
    await course.save();

    await User.findByIdAndUpdate(studentId, { $addToSet: { enrolledCourses: course._id } });

    return this.toDto(course);
  }

  static async listCourses(userId: string, role: string) {
    let query: any = { deletedAt: null };
    
    if (role === 'teacher') {
      query.teacherId = userId;
    } else {
      query.students = userId;
    }

    const courses = await Course.find(query).sort({ createdAt: -1 }).lean();
    return courses.map(c => this.toDto(c as any));
  }

  static async getCourse(courseId: string, userId: string, role: string) {
    const course = await Course.findOne({ _id: courseId, deletedAt: null }).lean();
    if (!course) throw new AppError('Course not found', 404, ErrorCodes.NOT_FOUND);

    if (role === 'teacher' && course.teacherId.toString() !== userId) {
      throw new AppError('Unauthorized', 403, ErrorCodes.FORBIDDEN);
    }
    if (role === 'student' && !course.students.some(s => s.toString() === userId)) {
      throw new AppError('Not enrolled', 403, ErrorCodes.FORBIDDEN);
    }

    return this.toDto(course as any);
  }
}
