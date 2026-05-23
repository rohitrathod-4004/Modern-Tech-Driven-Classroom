import mongoose, { Schema, Document } from 'mongoose';
import { PaymentStatus, PurchaserType } from '@classroom/shared';

export interface IBillingPaymentDocument extends Document {
  provider: string; // 'razorpay'
  providerOrderId: string;
  providerPaymentId?: string;
  purchaserId: mongoose.Types.ObjectId;
  purchaserType: PurchaserType;
  walletId: mongoose.Types.ObjectId;
  amountInr: number;
  creditsPurchased: number;
  packageId: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const BillingPaymentSchema = new Schema<IBillingPaymentDocument>({
  provider: { type: String, required: true, default: 'razorpay' },
  providerOrderId: { type: String, required: true, index: true },
  providerPaymentId: { type: String, unique: true, sparse: true, index: true }, // Idempotency guard
  purchaserId: { type: Schema.Types.ObjectId, required: true, index: true },
  purchaserType: { type: String, enum: ['individual', 'organization'], required: true },
  walletId: { type: Schema.Types.ObjectId, ref: 'CreditWallet', required: true },
  amountInr: { type: Number, required: true },
  creditsPurchased: { type: Number, required: true },
  packageId: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['created', 'pending_verification', 'verified', 'failed', 'refunded'], 
    default: 'created',
    required: true
  }
}, { timestamps: true });

export const BillingPayment = mongoose.model<IBillingPaymentDocument>('BillingPayment', BillingPaymentSchema);
