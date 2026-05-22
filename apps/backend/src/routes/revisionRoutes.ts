import express, { Request, Response, RequestHandler } from "express";
import { requireAuth } from "../middleware/auth";
import { Quiz } from "../models/Quiz";
import { QuizAttempt } from "../models/QuizAttempt";
import { FlashcardProgress } from "../models/FlashcardProgress";
import mongoose from "mongoose";

const router = express.Router();

const postQuizAttemptHandler: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { session_id, quiz_id, answers } = req.body;

    if (!session_id || !quiz_id || !Array.isArray(answers)) {
      res.status(400).json({ error: "session_id, quiz_id, and answers (array) are required" });
      return;
    }

    const quiz = await Quiz.findById(quiz_id);
    if (!quiz) {
      res.status(404).json({ error: "Quiz not found" });
      return;
    }

    // Calculate score
    let score = 0;
    const totalQuestions = quiz.questions.length;
    
    quiz.questions.forEach((q, index) => {
      if (answers[index] === q.answerIndex) {
        score++;
      }
    });

    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    const attempt = await QuizAttempt.create({
      student_id: new mongoose.Types.ObjectId(req.user!.userId),
      session_id,
      quiz_id: quiz._id,
      answers,
      score,
      percentage,
      completedAt: new Date()
    });

    res.status(201).json({ attempt });
  } catch (error: any) {
    console.error("[RevisionRouter] postQuizAttemptError:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const putFlashcardProgressHandler: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { session_id, card_id, status, masteryLevel } = req.body;

    if (!session_id || !card_id || !status) {
      res.status(400).json({ error: "session_id, card_id, and status are required" });
      return;
    }

    const student_id = new mongoose.Types.ObjectId(req.user!.userId);
    const progress = await FlashcardProgress.findOneAndUpdate(
      { student_id, card_id: new mongoose.Types.ObjectId(card_id) },
      {
        $set: {
          session_id,
          status,
          masteryLevel: typeof masteryLevel === "number" ? masteryLevel : 0,
          lastReviewed: new Date()
        },
        $inc: { reviewCount: 1 }
      },
      { upsert: true, new: true }
    );

    res.json({ progress });
  } catch (error: any) {
    console.error("[RevisionRouter] putFlashcardProgressError:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

router.post("/quiz-attempts", requireAuth, postQuizAttemptHandler);
router.put("/flashcards/progress", requireAuth, putFlashcardProgressHandler);

export default router;
