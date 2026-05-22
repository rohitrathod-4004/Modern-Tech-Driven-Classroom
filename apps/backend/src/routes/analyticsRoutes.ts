import express, { Request, Response, RequestHandler } from "express";
import { requireAuth, requireRole } from "../middleware/auth";
import { Classroom } from "../models/Classroom";
import { LectureSession } from "../models/LectureSession";
import { QuizAttempt } from "../models/QuizAttempt";
import { FlashcardProgress } from "../models/FlashcardProgress";
import { Flashcard } from "../models/Flashcard";
import { Bookmark } from "../models/Bookmark";
import { User } from "../models/User";
import mongoose from "mongoose";

const router = express.Router();

// Helper to calculate LHS for a given student in a specific classroom scope
async function calculateLHS(studentId: mongoose.Types.ObjectId, beforeDate?: Date) {
  const queryFilter = (field: string) => {
    return beforeDate ? { $lt: beforeDate } : { $exists: true };
  };

  // 1. Get student classrooms
  const classrooms = await Classroom.find({ students: studentId });
  const classroomIds = classrooms.map(c => c._id);

  // 2. Get completed sessions
  const sessionQuery: any = { classroom_id: { $in: classroomIds }, status: "completed" };
  if (beforeDate) {
    sessionQuery.endedAt = { $lt: beforeDate };
  }
  const sessions = await LectureSession.find(sessionQuery);
  const sessionIds = sessions.map(s => s.session_id);

  // 3. Quiz Average (QA)
  const attemptQuery: any = { student_id: studentId };
  if (beforeDate) {
    attemptQuery.completedAt = { $lt: beforeDate };
  }
  const attempts = await QuizAttempt.find(attemptQuery);
  const quizAverage = attempts.length === 0 ? 50 : attempts.reduce((acc, a) => acc + a.percentage, 0) / attempts.length;

  // 4. Flashcard Mastery (FM)
  const cardQuery: any = { session_id: { $in: sessionIds } };
  if (beforeDate) {
    cardQuery.generatedAt = { $lt: beforeDate };
  }
  const decks = await Flashcard.find(cardQuery);
  const totalCards = decks.reduce((acc, d) => acc + d.cards.length, 0);

  const progressQuery: any = { 
    student_id: studentId, 
    session_id: { $in: sessionIds }, 
    status: "mastered" 
  };
  if (beforeDate) {
    progressQuery.lastReviewed = { type: Date, $lt: beforeDate };
  }
  const masteredCount = await FlashcardProgress.countDocuments(progressQuery);
  const flashcardMastery = totalCards > 0 ? (masteredCount / totalCards) * 100 : 0;

  // 5. Attendance Score (AS)
  const totalLectures = sessions.length;
  
  const qaSessionsQuery: any = { student_id: studentId, session_id: { $in: sessionIds } };
  if (beforeDate) qaSessionsQuery.completedAt = { $lt: beforeDate };
  const attemptedSessions = await QuizAttempt.distinct("session_id", qaSessionsQuery);

  const fcSessionsQuery: any = { student_id: studentId, session_id: { $in: sessionIds } };
  if (beforeDate) fcSessionsQuery.lastReviewed = { $lt: beforeDate };
  const flashcardSessions = await FlashcardProgress.distinct("session_id", fcSessionsQuery);

  const bmSessionsQuery: any = { user_id: studentId, session_id: { $in: sessionIds } };
  if (beforeDate) bmSessionsQuery.createdAt = { $lt: beforeDate };
  const bookmarkedSessions = await Bookmark.distinct("session_id", bmSessionsQuery);

  const attendedSet = new Set([...attemptedSessions, ...flashcardSessions, ...bookmarkedSessions]);
  const attendanceScore = totalLectures > 0 ? (attendedSet.size / totalLectures) * 100 : 100;

  // 6. Revision Activity (RA) - in the 14 days leading to beforeDate (or now)
  const refEnd = beforeDate ? beforeDate : new Date();
  const refStart = new Date(refEnd.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentQuizzes = await QuizAttempt.countDocuments({
    student_id: studentId,
    completedAt: { $gte: refStart, $lt: refEnd }
  });

  const recentCards = await FlashcardProgress.countDocuments({
    student_id: studentId,
    lastReviewed: { $gte: refStart, $lt: refEnd }
  });

  const revisionActivity = Math.min(100, ((recentQuizzes + recentCards) / 10) * 100);

  // 7. Bookmark Activity (BA)
  const bmCountQuery: any = { user_id: studentId, session_id: { $in: sessionIds } };
  if (beforeDate) bmCountQuery.createdAt = { $lt: beforeDate };
  const bookmarkCount = await Bookmark.countDocuments(bmCountQuery);
  const bookmarkActivity = Math.min(100, (bookmarkCount / 5) * 100);

  // Calculate global LHS
  const lhs = 0.35 * quizAverage + 0.25 * flashcardMastery + 0.20 * attendanceScore + 0.10 * revisionActivity + 0.10 * bookmarkActivity;

  return {
    lhs: Math.round(lhs * 10) / 10,
    quizAverage: Math.round(quizAverage * 10) / 10,
    flashcardMastery: Math.round(flashcardMastery * 10) / 10,
    attendanceScore: Math.round(attendanceScore * 10) / 10,
    revisionActivity: Math.round(revisionActivity * 10) / 10,
    bookmarkActivity: Math.round(bookmarkActivity * 10) / 10
  };
}

const getStudentHealthHandler: RequestHandler = async (req: Request, res: Response) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user!.userId);
    const health = await calculateLHS(studentId);
    res.json(health);
  } catch (error: any) {
    console.error("[AnalyticsRouter] getStudentHealthError:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getFacultyRiskHandler: RequestHandler = async (req: Request, res: Response) => {
  try {
    const facultyId = new mongoose.Types.ObjectId(req.user!.userId);

    // 1. Get classrooms owned by faculty
    const classrooms = await Classroom.find({ faculty_id: facultyId });
    if (classrooms.length === 0) {
      res.json({ atRisk: [], improving: [], inactive: [] });
      return;
    }

    // 2. Collect unique students
    const studentIdsSet = new Set<string>();
    classrooms.forEach(c => {
      c.students.forEach(s => studentIdsSet.add(s.toString()));
    });

    const students = await User.find({ _id: { $in: Array.from(studentIdsSet).map(id => new mongoose.Types.ObjectId(id)) } });

    const atRisk: any[] = [];
    const improving: any[] = [];
    const inactive: any[] = [];

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const student of students) {
      const studentId = student._id as mongoose.Types.ObjectId;
      const currentHealth = await calculateLHS(studentId);

      // Check inactive
      const lastQuiz = await QuizAttempt.findOne({ student_id: studentId }).sort({ completedAt: -1 });
      const lastCard = await FlashcardProgress.findOne({ student_id: studentId }).sort({ lastReviewed: -1 });
      const lastBookmark = await Bookmark.findOne({ user_id: studentId }).sort({ createdAt: -1 });

      const dates = [
        lastQuiz?.completedAt,
        lastCard?.lastReviewed,
        lastBookmark?.createdAt
      ].filter(d => d !== undefined) as Date[];

      const hasActivity = dates.length > 0;
      const maxDate = hasActivity ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
      const isInactive = !hasActivity || (maxDate && maxDate < sevenDaysAgo);

      // Check improving (difference in LHS over past 7 days)
      const healthSevenDaysAgo = await calculateLHS(studentId, sevenDaysAgo);
      const isImproving = (currentHealth.lhs - healthSevenDaysAgo.lhs) >= 5.0;

      // Check at-risk
      const isAtRisk = currentHealth.lhs < 60 || currentHealth.quizAverage < 55;

      const studentData = {
        id: student._id,
        name: student.name,
        email: student.email,
        lhs: currentHealth.lhs,
        quizAverage: currentHealth.quizAverage,
        flashcardMastery: currentHealth.flashcardMastery,
        attendanceScore: currentHealth.attendanceScore,
        lastActive: maxDate
      };

      if (isInactive) {
        inactive.push(studentData);
      }
      if (isAtRisk) {
        atRisk.push(studentData);
      }
      if (isImproving && !isInactive) {
        improving.push(studentData);
      }
    }

    res.json({ atRisk, improving, inactive });
  } catch (error: any) {
    console.error("[AnalyticsRouter] getFacultyRiskError:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

router.get("/student/health", requireAuth, requireRole("student"), getStudentHealthHandler);
router.get("/faculty/risk", requireAuth, requireRole("faculty"), getFacultyRiskHandler);

export default router;
