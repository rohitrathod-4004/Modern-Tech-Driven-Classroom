import { Course } from '../../models/Course';
import { Lecture } from '../../models/Lecture';
import { DashboardStatsDto } from '@classroom/shared';
import mongoose from 'mongoose';

export class DashboardService {
  static async getStats(userId: string, role: string): Promise<DashboardStatsDto> {
    if (role === 'teacher') {
      return this.getTeacherStats(userId);
    } else {
      return this.getStudentStats(userId);
    }
  }

  private static async getTeacherStats(teacherId: string): Promise<DashboardStatsDto> {
    // 1. Get all courses owned by teacher
    const courses = await Course.find({ teacherId, deletedAt: null }).lean();
    const courseIds = courses.map(c => c._id);
    
    // 2. Count unique students
    const uniqueStudents = new Set<string>();
    courses.forEach(c => {
      c.students.forEach(s => uniqueStudents.add(s.toString()));
    });

    // 3. Get lectures for these courses
    const lectures = await Lecture.find({ courseId: { $in: courseIds }, deletedAt: null }).lean();
    
    // 4. Calculate total hours recorded (sum of durationSeconds)
    const totalSeconds = lectures.reduce((acc, lec) => acc + (lec.durationSeconds || 0), 0);
    const totalHoursRecorded = Math.round((totalSeconds / 3600) * 10) / 10;

    // 5. AI Processing ready (completed lectures)
    const aiProcessingReady = lectures.filter(l => l.status === 'ready').length;

    // 6. Total Study Materials (Mock: Assume 10 flashcards per completed lecture for now until StudyProgress is built)
    const totalStudyMaterials = aiProcessingReady * 10;

    return {
      totalCourses: courses.length,
      totalStudents: uniqueStudents.size,
      totalLectures: lectures.length,
      totalHoursRecorded,
      totalStudyMaterials,
      aiProcessingReady
    };
  }

  private static async getStudentStats(studentId: string): Promise<DashboardStatsDto> {
    // 1. Get courses student is enrolled in
    const courses = await Course.find({ students: studentId, deletedAt: null }).lean();
    const courseIds = courses.map(c => c._id);

    // 2. Get lectures for these courses
    const lectures = await Lecture.find({ courseId: { $in: courseIds }, deletedAt: null }).lean();
    
    // 3. Calculate total hours recorded
    const totalSeconds = lectures.reduce((acc, lec) => acc + (lec.durationSeconds || 0), 0);
    const totalHoursRecorded = Math.round((totalSeconds / 3600) * 10) / 10;

    const aiProcessingReady = lectures.filter(l => l.status === 'ready').length;
    
    // Total Study Materials for student
    const totalStudyMaterials = aiProcessingReady * 10;

    return {
      totalCourses: courses.length,
      totalLectures: lectures.length,
      totalHoursRecorded,
      totalStudyMaterials,
      aiProcessingReady
    };
  }

  static async getRecentLectures(userId: string, role: string, limit: number = 3) {
    let courseIds: mongoose.Types.ObjectId[] = [];
    if (role === 'teacher') {
      const courses = await Course.find({ teacherId: userId, deletedAt: null }).lean();
      courseIds = courses.map(c => c._id);
    } else {
      const courses = await Course.find({ students: userId, deletedAt: null }).lean();
      courseIds = courses.map(c => c._id);
    }

    const lectures = await Lecture.find({ courseId: { $in: courseIds }, deletedAt: null })
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();

    return lectures.map(lec => ({
      id: lec._id,
      title: lec.title,
      courseId: lec.courseId,
      durationSeconds: lec.durationSeconds,
      status: lec.status,
      startedAt: lec.startedAt
    }));
  }
}
