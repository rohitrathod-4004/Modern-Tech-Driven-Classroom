import mongoose from 'mongoose';
import { razorpayProvider } from './providers/razorpay.provider';
import { BillingPayment } from '../../models/BillingPayment';
import { BillingEvent } from '../../models/BillingEvent';
import { WalletService } from '../wallet/wallet.service';
import { AppError } from '../../utils/AppError';
import { BILLING_PACKAGES, PurchaserType } from '@classroom/shared';
import { withTransactionFallback } from '../../utils/transaction';

export class BillingService {
  /**
   * Generates an order, initializes payment state
   */
  static async createOrder(
    packageId: string,
    purchaserId: string,
    purchaserType: PurchaserType,
    walletId: string
  ) {
    // 1. Validate package ownership and backend price
    const pkg = Object.values(BILLING_PACKAGES).find((p) => p.id === packageId);
    if (!pkg) throw new AppError('Invalid billing package', 400);
    
    if (pkg.purchaserType !== purchaserType) {
      throw new AppError('This package is not available for your account type', 403);
    }

    let orderPayload: any;
    try {
      await withTransactionFallback(async (session) => {
        // 2. We generate an internal ID to use as a receipt for Razorpay
        const internalPaymentId = new mongoose.Types.ObjectId();

        // 3. Call Razorpay adapter
        const razorpayOrder = await razorpayProvider.createOrder(pkg.amountInr, internalPaymentId.toString());

        // 4. Save Payment intent locally
        const payment = new BillingPayment({
          _id: internalPaymentId,
          provider: 'razorpay',
          providerOrderId: razorpayOrder.id,
          purchaserId,
          purchaserType,
          walletId,
          amountInr: pkg.amountInr,
          creditsPurchased: pkg.credits,
          packageId: pkg.id,
          status: 'created'
        });
        await payment.save({ session });

        // 5. Save Event Audit
        const event = new BillingEvent({
          paymentId: payment._id,
          eventType: 'checkout_initialized',
          metadata: { providerOrderId: razorpayOrder.id }
        });
        await event.save({ session });

        orderPayload = {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount, // in paise
          currency: razorpayOrder.currency,
          key: process.env.RAZORPAY_KEY_ID || 'mock_key',
          internalPaymentId: payment._id.toString()
        };
      });
    } catch (error) {
      throw error;
    }

    return orderPayload;
  }

  /**
   * Idempotent payment verification and wallet recharge
   */
  static async verifyPayment(
    internalPaymentId: string,
    providerOrderId: string,
    providerPaymentId: string,
    signature: string
  ): Promise<boolean> {
    let success = false;

    try {
      await withTransactionFallback(async (session) => {
        const payment = await BillingPayment.findById(internalPaymentId).session(session || null);
        if (!payment) throw new AppError('Payment not found', 404);

        // 1. Idempotency Guard: Stop processing if already verified
        if (payment.status === 'verified') {
          success = true; // Safely no-op, treat as success
          return;
        }

        // Only process if status is created
        if (payment.status !== 'created' && payment.status !== 'pending_verification') {
          throw new AppError('Payment is in an invalid state for verification', 400);
        }

        // 2. Validate Razorpay Signature
        const isValid = razorpayProvider.verifySignature(providerOrderId, providerPaymentId, signature);
        
        if (!isValid) {
          // Log failure
          payment.status = 'failed';
          await payment.save({ session });
          
          await new BillingEvent({
            paymentId: payment._id,
            eventType: 'recharge_failed',
            metadata: { reason: 'Invalid Signature', providerPaymentId }
          }).save({ session });
          
          throw new AppError('Payment verification failed. Invalid signature.', 400);
        }

        // 3. Mark as verified
        payment.status = 'verified';
        payment.providerPaymentId = providerPaymentId; // Ensures unique index prevents double charging
        await payment.save({ session });

        await new BillingEvent({
          paymentId: payment._id,
          eventType: 'payment_verified',
          metadata: { providerPaymentId }
        }).save({ session });

        // 4. Atomically Recharge Wallet (updates counters and creates CreditTransaction log)
        await WalletService.rechargeWallet(
          payment.walletId.toString(),
          payment.creditsPurchased,
          payment._id.toString(),
          session
        );

        await new BillingEvent({
          paymentId: payment._id,
          eventType: 'recharge_completed',
          metadata: { creditsAdded: payment.creditsPurchased }
        }).save({ session });

        success = true;
      });
    } catch (error: any) {
      if (error.code === 11000) {
        // Unique constraint violation on providerPaymentId (double charge protection)
        success = true; // Act idempotent
      } else {
        throw error;
      }
    }

    return success;
  }
}
