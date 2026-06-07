import mongoose, { Schema, Document } from 'mongoose';

export interface ICreditUsageDocument extends Document {
  lectureId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  organizationId?: mongoose.Types.ObjectId;
  creditsConsumed: number;
  durationConsumed: number; // in seconds
  source: 'lecture_finalized';
  createdAt: Date;
  updatedAt: Date;
}

const CreditUsageSchema = new Schema<ICreditUsageDocument>({
  lectureId: { type: Schema.Types.ObjectId, ref: 'Lecture', required: true, index: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', index: true },
  creditsConsumed: { type: Number, required: true },
  durationConsumed: { type: Number, required: true },
  source: { type: String, enum: ['lecture_finalized'], required: true, default: 'lecture_finalized' }
}, { timestamps: true });

export const CreditUsage = mongoose.model<ICreditUsageDocument>('CreditUsage', CreditUsageSchema);
