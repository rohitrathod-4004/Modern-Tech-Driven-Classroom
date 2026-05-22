import mongoose, { Schema, Document } from "mongoose";

export interface IQuizAttempt extends Document {
  student_id: mongoose.Types.ObjectId; // Reference to User
  session_id: string;                  // Unique Lecture session_id
  quiz_id: mongoose.Types.ObjectId;     // Reference to Quiz
  answers: number[];                   // Selected option indexes (e.g. [0, 1, 3, 2, 0])
  score: number;                       // Number of correct answers (e.g. 4)
  percentage: number;                  // Score as percent (e.g. 80.0)
  completedAt: Date;
}

const QuizAttemptSchema = new Schema<IQuizAttempt>({
  student_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  session_id: { type: String, required: true, index: true },
  quiz_id: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
  answers: [{ type: Number, required: true }],
  score: { type: Number, required: true },
  percentage: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now, index: true }
});

// Compound index for student performance queries
QuizAttemptSchema.index({ student_id: 1, session_id: 1 });

export const QuizAttempt = mongoose.model<IQuizAttempt>("QuizAttempt", QuizAttemptSchema);
