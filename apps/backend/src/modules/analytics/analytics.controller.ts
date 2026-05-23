import { Request, Response } from 'express';
import { Organization } from '../../models/Organization';
import { User } from '../../models/User';
import { Lecture } from '../../models/Lecture';
import { CreditWallet } from '../../models/CreditWallet';
import { CreditTransaction } from '../../models/CreditTransaction';
import mongoose from 'mongoose';

export class AnalyticsController {
  
  static async getOrganizationAnalytics(req: Request, res: Response) {
    const orgId = req.user?.organizationId;
    
    // Aggregation for burn rate (just total consumed for now)
    const orgWallet = await CreditWallet.findOne({ ownerId: orgId }).lean();
    
    const [totalLectures, activeTeachers] = await Promise.all([
      Lecture.countDocuments({ organizationId: orgId }),
      User.countDocuments({ organizationId: orgId, role: 'teacher' })
    ]);

    let burnRateChart: { date: string; credits: number }[] = [];
    if (orgWallet) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const transactions = await CreditTransaction.find({
        walletId: orgWallet._id,
        type: 'debit',
        createdAt: { $gte: sevenDaysAgo }
      }).lean();

      const aggregated = new Map<string, number>();
      
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        aggregated.set(d.toISOString().split('T')[0], 0);
      }

      transactions.forEach((t: any) => {
        const dateKey = t.createdAt.toISOString().split('T')[0];
        if (aggregated.has(dateKey)) {
          aggregated.set(dateKey, aggregated.get(dateKey)! + t.amount);
        }
      });

      burnRateChart = Array.from(aggregated.entries()).map(([date, credits]) => ({
        date,
        credits
      }));
    }

    res.json({
      success: true,
      data: {
        totalCredits: orgWallet?.totalCredits || 0,
        consumedCredits: orgWallet?.consumedCredits || 0,
        remainingCredits: orgWallet?.remainingCredits || 0,
        totalLectures,
        activeTeachers,
        burnRateChart
      }
    });
  }

  static async getLiveOperations(req: Request, res: Response) {
    const orgId = req.user?.organizationId;

    const liveLectures = await Lecture.find({ 
      organizationId: orgId, 
      status: { $in: ['recording', 'ai_processing'] } 
    })
    .populate('teacherId', 'name email')
    .sort({ createdAt: -1 })
    .lean();

    res.json({
      success: true,
      data: {
        liveLectures
      }
    });
  }

  static async getTeacherAnalytics(req: Request, res: Response) {
    const teacherId = req.user?.id;
    
    const [totalLectures, recentLectures, courses, pendingJobs] = await Promise.all([
      Lecture.countDocuments({ teacherId }),
      Lecture.find({ teacherId }).sort({ createdAt: -1 }).limit(5).lean(),
      import('../../models/Course').then(m => m.Course.find({ teacherId }).select('students').lean()),
      Lecture.countDocuments({ teacherId, status: 'ai_processing' })
    ]);

    const activeCourses = courses.length;
    const uniqueStudents = new Set<string>();
    courses.forEach(course => {
      if (course.students) {
        course.students.forEach((studentId: any) => uniqueStudents.add(studentId.toString()));
      }
    });
    const totalStudents = uniqueStudents.size;

    res.json({
      success: true,
      data: {
        activeCourses,
        totalStudents,
        totalLectures,
        pendingJobs,
        recentLectures
      }
    });
  }

  static async getStudentAnalytics(req: Request, res: Response) {
    const studentId = req.user?.id;
    const student = await User.findById(studentId).select('enrolledCourses').lean();
    const enrolledCount = student?.enrolledCourses?.length || 0;

    res.json({
      success: true,
      data: {
        enrolledCourses: enrolledCount,
        studyStreak: 3, // Mocked study streak
        flashcardsMastered: 42 // Mocked flashcards
      }
    });
  }
}
