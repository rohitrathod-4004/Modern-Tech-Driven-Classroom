import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, AccountType } from '@classroom/shared';

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  accountType?: AccountType;
  organizationId?: mongoose.Types.ObjectId;
  walletId?: mongoose.Types.ObjectId;
  enrolledCourses: mongoose.Types.ObjectId[];
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher', 'admin', 'org_admin'], default: 'student' },
  accountType: { type: String, enum: ['individual', 'organization_member'] },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization' },
  walletId: { type: Schema.Types.ObjectId, ref: 'CreditWallet' },
  enrolledCourses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  tokenVersion: { type: Number, default: 0 }
}, { timestamps: true });

export const User = mongoose.model<IUserDocument>('User', UserSchema);
