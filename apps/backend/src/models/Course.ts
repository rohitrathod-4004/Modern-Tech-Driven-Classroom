import mongoose, { Schema, Document } from 'mongoose';

export interface ICourseDocument extends Document {
  title: string;
  description?: string;
  teacherId: mongoose.Types.ObjectId;
  enrollmentCode: string;
  students: mongoose.Types.ObjectId[];
  isActive: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourseDocument>({
  title: { type: String, required: true },
  description: { type: String },
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  enrollmentCode: { type: String, unique: true, sparse: true, index: true },
  students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export const Course = mongoose.model<ICourseDocument>('Course', CourseSchema);
