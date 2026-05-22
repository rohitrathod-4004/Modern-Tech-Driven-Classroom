import mongoose, { Schema, Document } from "mongoose";

export interface IFlashcardItem {
  front: string;
  back: string;
}

export interface IFlashcard extends Document {
  session_id: string;
  cards: IFlashcardItem[];
  generatedAt: Date;
}

const FlashcardItemSchema = new Schema<IFlashcardItem>({
  front: { type: String, required: true },
  back: { type: String, required: true }
});

const FlashcardSchema = new Schema<IFlashcard>({
  session_id: { type: String, required: true, unique: true, index: true },
  cards: [FlashcardItemSchema],
  generatedAt: { type: Date, default: Date.now }
});

export const Flashcard = mongoose.model<IFlashcard>("Flashcard", FlashcardSchema);
