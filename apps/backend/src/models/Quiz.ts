import mongoose, { Schema, Document } from "mongoose";

export interface IQuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface IQuiz extends Document {
  session_id: string;
  questions: IQuizQuestion[];
  generatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answerIndex: { type: Number, required: true },
  explanation: { type: String, required: true }
});

const QuizSchema = new Schema<IQuiz>({
  session_id: { type: String, required: true, unique: true, index: true },
  questions: [QuizQuestionSchema],
  generatedAt: { type: Date, default: Date.now }
});

export const Quiz = mongoose.model<IQuiz>("Quiz", QuizSchema);
