import mongoose, { Schema, Document } from 'mongoose';
import { LectureStatus, AiStatus } from '@classroom/shared';

export interface ILectureDocument extends Document {
  courseId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  title: string;
  status: LectureStatus;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  chunkCount: number;
  transcriptionLanguage?: string;
  processingLatencyMs?: number;
  audioStoragePath?: string;
  latestChunkReceivedAt?: Date;
  processingStartedAt?: Date;
  processingCompletedAt?: Date;
  
  // Phase 3A: AI Extensions
  summary?: {
    short: string;
    detailed: string;
  };
  topics?: Array<{
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    summary?: string;
  }>;
  aiStatus?: AiStatus;
  processingError?: {
    stage: string;
    message: string;
    timestamp: Date;
  };
  processingMetrics?: {
    summarizationMs?: number;
    embeddingMs?: number;
    totalTokens?: number;
    estimatedCostUsd?: number;
  };
  summaryGeneratedAt?: Date;
  embeddingsGeneratedAt?: Date;
  topicsGeneratedAt?: Date;
  aiProvider?: 'gemini' | 'openai' | 'local';
  aiModel?: string;

  // Phase 3B: Hardening
  aiJobId?: string;
  aiProcessingVersion?: number;
  promptVersion?: string;
  retryCount?: number;

  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const LectureSchema = new Schema<ILectureDocument>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['recording', 'transcribing', 'ai_processing', 'ready', 'failed'], default: 'recording' },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  durationSeconds: { type: Number },
  chunkCount: { type: Number, default: 0 },
  transcriptionLanguage: { type: String },
  processingLatencyMs: { type: Number },
  audioStoragePath: { type: String },
  latestChunkReceivedAt: { type: Date },
  processingStartedAt: { type: Date },
  processingCompletedAt: { type: Date },

  // Phase 3A: AI Extensions
  summary: {
    short: { type: String },
    detailed: { type: String }
  },
  topics: [{
    id: { type: String },
    title: { type: String },
    startTime: { type: Number },
    endTime: { type: Number },
    summary: { type: String }
  }],
  aiStatus: { type: String, enum: ['pending', 'queued', 'summarizing', 'embedding', 'indexing', 'generating_study_materials', 'completed', 'failed'], default: 'pending' },
  processingError: {
    stage: { type: String },
    message: { type: String },
    timestamp: { type: Date }
  },
  processingMetrics: {
    summarizationMs: { type: Number },
    embeddingMs: { type: Number },
    totalTokens: { type: Number },
    estimatedCostUsd: { type: Number }
  },
  summaryGeneratedAt: { type: Date },
  embeddingsGeneratedAt: { type: Date },
  topicsGeneratedAt: { type: Date },
  aiProvider: { type: String },
  aiModel: { type: String },

  // Phase 3B: Hardening
  aiJobId: { type: String, index: true },
  aiProcessingVersion: { type: Number, default: 0 },
  promptVersion: { type: String },
  retryCount: { type: Number, default: 0 },

  deletedAt: { type: Date, default: null }
}, { timestamps: true });

LectureSchema.index(
  { title: 'text', 'summary.short': 'text', 'topics.title': 'text' },
  { weights: { title: 10, 'topics.title': 5, 'summary.short': 2 }, name: 'lecture_text_search' }
);

export const Lecture = mongoose.model<ILectureDocument>('Lecture', LectureSchema);
