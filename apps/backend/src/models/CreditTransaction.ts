import mongoose, { Schema, Document } from 'mongoose';
import { TransactionSource } from '@classroom/shared';

export interface ICreditTransactionDocument extends Document {
  walletId: mongoose.Types.ObjectId;
  amount: number;
  type: 'credit' | 'debit';
  source: TransactionSource;
  description: string;
  referenceId?: string; // lectureId, stripeInvoiceId, inviteId, etc.
  createdAt: Date;
  updatedAt: Date;
}

const CreditTransactionSchema = new Schema<ICreditTransactionDocument>({
  walletId: { type: Schema.Types.ObjectId, ref: 'CreditWallet', required: true, index: true },
  amount: { type: Number, required: true, min: 0 }, // always positive, 'type' dictates sign
  type: { type: String, enum: ['credit', 'debit'], required: true },
  source: { 
    type: String, 
    enum: ['allocation', 'lecture_consumption', 'recharge', 'refund', 'welcome_bonus'], 
    required: true 
  },
  description: { type: String, required: true },
  referenceId: { type: String }
}, { timestamps: true });

export const CreditTransaction = mongoose.model<ICreditTransactionDocument>('CreditTransaction', CreditTransactionSchema);
