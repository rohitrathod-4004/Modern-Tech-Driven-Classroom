import mongoose, { Schema, Document } from "mongoose";

export interface ITranscriptChunk extends Document {
  session_id: string; // Legacy support to not break existing pipeline yet
  lectureId?: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  chunk_index: number;
  text: string;
  start_time: number;
  end_time: number;
  confidenceScore?: number;
  latencyMs?: number;
  processingProvider?: string;
  created_at: Date;
  updatedAt: Date;
}

const TranscriptChunkSchema = new Schema<ITranscriptChunk>({
  session_id:  { type: String,  required: true, index: true }, // Keeping for backwards compatibility
  lectureId:   { type: Schema.Types.ObjectId, ref: 'Lecture', index: true },
  courseId:    { type: Schema.Types.ObjectId, ref: 'Course', index: true },
  chunk_index: { type: Number,  required: true },
  text:        { type: String,  default: "" },
  start_time:  { type: Number,  required: true },
  end_time:    { type: Number,  required: true },
  confidenceScore: { type: Number },
  latencyMs: { type: Number },
  processingProvider: { type: String },
  created_at:  { type: Date,    default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updatedAt' } });

// Compound unique index: fast lookups, ordering, and idempotency enforcement
TranscriptChunkSchema.index({ session_id: 1, chunk_index: 1 }, { unique: true });
// Text index for search
TranscriptChunkSchema.index({ text: 'text' }, { name: 'transcript_text_search' });

export const TranscriptChunk = mongoose.model<ITranscriptChunk>(
  "TranscriptChunk",
  TranscriptChunkSchema
);
