import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizQuestion {
  id: string;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ILectureQuizDocument extends Document {
  lectureId: mongoose.Types.ObjectId;
  questions: IQuizQuestion[];
  generatedAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  id: { type: String, required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  answerIndex: { type: Number, required: true },
  explanation: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true }
}, { _id: false });

const LectureQuizSchema = new Schema<ILectureQuizDocument>({
  lectureId: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true, index: true },
  questions: [QuizQuestionSchema],
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const LectureQuiz = mongoose.model<ILectureQuizDocument>('LectureQuiz', LectureQuizSchema);
