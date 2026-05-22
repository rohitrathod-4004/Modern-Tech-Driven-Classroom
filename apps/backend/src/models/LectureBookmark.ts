import mongoose, { Schema, Document } from 'mongoose';

export interface ILectureBookmark extends Document {
  lectureId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  timestamp: number; // in seconds
  title?: string;
  chunkId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LectureBookmarkSchema = new Schema(
  {
    lectureId: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timestamp: { type: Number, required: true },
    title: { type: String },
    chunkId: { type: Schema.Types.ObjectId, ref: 'TranscriptChunk' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Index for efficient querying by a user within a specific lecture
LectureBookmarkSchema.index({ lectureId: 1, userId: 1, timestamp: 1 });

export const LectureBookmark = mongoose.model<ILectureBookmark>('LectureBookmark', LectureBookmarkSchema);
