import mongoose, { Schema, Document } from 'mongoose';

export interface ILectureEmbeddingDocument extends Document {
  lectureId: mongoose.Types.ObjectId;
  chunkId: string;
  text: string;
  embedding: number[];
  absoluteStartTime: number;
  embeddingModel?: string;
  embeddingDimension?: number;
  embeddingVersion?: string;
  createdAt: Date;
}

const LectureEmbeddingSchema = new Schema<ILectureEmbeddingDocument>({
  lectureId: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true, index: true },
  chunkId: { type: String, required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], required: true },
  absoluteStartTime: { type: Number, required: true },
  embeddingModel: { type: String },
  embeddingDimension: { type: Number },
  embeddingVersion: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Compound index for time-based retrieval
LectureEmbeddingSchema.index({ lectureId: 1, absoluteStartTime: 1 });

export const LectureEmbedding = mongoose.model<ILectureEmbeddingDocument>('LectureEmbedding', LectureEmbeddingSchema);
