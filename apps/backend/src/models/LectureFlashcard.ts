import mongoose, { Schema, Document } from 'mongoose';

export interface IFlashcard {
  id: string;
  front: string;
  back: string;
}

export interface ILectureFlashcardDocument extends Document {
  lectureId: mongoose.Types.ObjectId;
  cards: IFlashcard[];
  generatedAt: Date;
  updatedAt: Date;
}

const FlashcardSchema = new Schema<IFlashcard>({
  id: { type: String, required: true },
  front: { type: String, required: true },
  back: { type: String, required: true }
}, { _id: false });

const LectureFlashcardSchema = new Schema<ILectureFlashcardDocument>({
  lectureId: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true, index: true },
  cards: [FlashcardSchema],
  generatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const LectureFlashcard = mongoose.model<ILectureFlashcardDocument>('LectureFlashcard', LectureFlashcardSchema);
