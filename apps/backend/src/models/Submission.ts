import mongoose, { Schema, Document } from 'mongoose';

export interface ISubmissionDocument extends Document {
  assignmentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  filePath: string;
  fileName: string;
  fileSize: number; // in bytes
  submittedAt: Date;
  grade?: string;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubmissionSchema = new Schema<ISubmissionDocument>({
  assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  filePath: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
  grade: { type: String },
  feedback: { type: String }
}, { timestamps: true });

// A student can submit only once per assignment
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

export const Submission = mongoose.model<ISubmissionDocument>('Submission', SubmissionSchema);
