import mongoose, { Schema, Document } from 'mongoose';

export interface ILectureNote extends Document {
  lectureId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  timestamp: number; // in seconds
  content: string;
  chunkId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LectureNoteSchema = new Schema(
  {
    lectureId: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Number, required: true },
    content: { type: String, required: true },
    chunkId: { type: Schema.Types.ObjectId, ref: 'TranscriptChunk' },
  },
  { timestamps: true }
);

// Index for efficient querying by a user within a specific lecture
LectureNoteSchema.index({ lectureId: 1, userId: 1, timestamp: 1 });

export const LectureNote = mongoose.model<ILectureNote>('LectureNote', LectureNoteSchema);
