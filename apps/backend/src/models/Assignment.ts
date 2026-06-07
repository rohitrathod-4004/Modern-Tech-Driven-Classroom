import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignmentDocument extends Document {
  courseId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  dueDate: Date;
  maxSizeMb: number;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignmentDocument>({
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  maxSizeMb: { type: Number, default: 10 },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

export const Assignment = mongoose.model<IAssignmentDocument>('Assignment', AssignmentSchema);
