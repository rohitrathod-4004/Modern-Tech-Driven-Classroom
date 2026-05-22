import mongoose, { Schema, Document } from "mongoose";

export interface IFlashcardProgress extends Document {
  student_id: mongoose.Types.ObjectId;  // Reference to User
  session_id: string;                   // Unique Lecture session_id
  card_id: mongoose.Types.ObjectId;      // Reference to a specific Flashcard sub-document
  status: "unseen" | "learning" | "mastered";
  reviewCount: number;                  // Total times reviewed
  masteryLevel: number;                 // Numeric rating (0 to 100) based on review scores
  lastReviewed: Date;
}

const FlashcardProgressSchema = new Schema<IFlashcardProgress>({
  student_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  session_id: { type: String, required: true, index: true },
  card_id: { type: Schema.Types.ObjectId, required: true },
  status: { 
    type: String, 
    enum: ["unseen", "learning", "mastered"], 
    default: "unseen",
    index: true 
  },
  reviewCount: { type: Number, default: 0 },
  masteryLevel: { type: Number, default: 0, min: 0, max: 100 },
  lastReviewed: { type: Date, default: Date.now }
});

// Ensure a student can only have one tracking card state per flashcard
FlashcardProgressSchema.index({ student_id: 1, card_id: 1 }, { unique: true });

export const FlashcardProgress = mongoose.model<IFlashcardProgress>("FlashcardProgress", FlashcardProgressSchema);
