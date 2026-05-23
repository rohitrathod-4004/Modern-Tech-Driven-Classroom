import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '@classroom/shared';

export interface IOrganizationInviteDocument extends Document {
  email: string;
  role: UserRole; // 'teacher' or 'org_admin'
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  organizationId: mongoose.Types.ObjectId;
  invitedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationInviteSchema = new Schema<IOrganizationInviteDocument>({
  email: { type: String, required: true, index: true },
  role: { type: String, enum: ['teacher', 'org_admin'], required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  acceptedAt: { type: Date },
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const OrganizationInvite = mongoose.model<IOrganizationInviteDocument>('OrganizationInvite', OrganizationInviteSchema);
