import mongoose from 'mongoose';
import { CreditWallet, ICreditWalletDocument } from '../../models/CreditWallet';
import { CreditTransaction } from '../../models/CreditTransaction';
import { CreditUsage } from '../../models/CreditUsage';
import { OwnerType, TransactionSource } from '@classroom/shared';
import { AppError } from '../../utils/AppError';
import { withTransactionFallback } from '../../utils/transaction';

export class WalletService {
  /**
   * Initializes a new wallet for a user or organization.
   */
  static async createWallet(ownerType: OwnerType, ownerId: string, initialCredits: number = 0): Promise<ICreditWalletDocument> {
    const wallet = await withTransactionFallback(async (session) => {
      // 1. Create wallet
      const newWallet = new CreditWallet({
        ownerType,
        ownerId,
        totalCredits: initialCredits,
        remainingCredits: initialCredits,
        consumedCredits: 0
      });
      await newWallet.save({ session });

      // 2. Create initial transaction log if credits > 0
      if (initialCredits > 0) {
        const tx = new CreditTransaction({
          walletId: newWallet._id,
          amount: initialCredits,
          type: 'credit',
          source: 'welcome_bonus',
          description: `Initial ${ownerType} welcome bonus`
        });
        await tx.save({ session });
      }
      return newWallet;
    });

    if (!wallet) throw new AppError('Failed to create wallet', 500);
    return wallet;
  }

  /**
   * Safely deducts credits for a finalized lecture.
   */
  static async deductLectureCredits(
    walletId: string, 
    creditsToDeduct: number, 
    durationInSeconds: number,
    lectureId: string,
    teacherId: string,
    organizationId?: string
  ): Promise<void> {
    await withTransactionFallback(async (session) => {
      const wallet = await CreditWallet.findById(walletId).session(session || null);
      if (!wallet) throw new AppError('Wallet not found', 404);

      if (wallet.remainingCredits < creditsToDeduct) {
        throw new AppError('Insufficient AI credits. Please recharge your wallet.', 402);
      }

      // 1. Update wallet balance
      wallet.remainingCredits -= creditsToDeduct;
      wallet.consumedCredits += creditsToDeduct;
      await wallet.save({ session });

      // 2. Log Transaction
      const tx = new CreditTransaction({
        walletId: wallet._id,
        amount: creditsToDeduct,
        type: 'debit',
        source: 'lecture_consumption',
        description: `Lecture AI processing (${Math.ceil(durationInSeconds/60)} mins)`,
        referenceId: lectureId
      });
      await tx.save({ session });

      // 3. Log Usage Metering
      const usage = new CreditUsage({
        lectureId,
        teacherId,
        organizationId,
        creditsConsumed: creditsToDeduct,
        durationConsumed: durationInSeconds,
        source: 'lecture_finalized'
      });
      await usage.save({ session });
    });
  }

  /**
   * Transfers credits from an organization to a teacher.
   */
  static async allocateCredits(orgWalletId: string, teacherWalletId: string, amount: number, orgAdminId: string): Promise<void> {
    if (amount <= 0) throw new AppError('Allocation amount must be greater than zero', 400);

    await withTransactionFallback(async (session) => {
      const orgWallet = await CreditWallet.findById(orgWalletId).session(session || null);
      const teacherWallet = await CreditWallet.findById(teacherWalletId).session(session || null);

      if (!orgWallet || !teacherWallet) throw new AppError('Wallet not found', 404);

      if (orgWallet.remainingCredits < amount) {
        throw new AppError('Organization has insufficient credits for this allocation', 400);
      }

      // 1. Deduct from Org
      orgWallet.remainingCredits -= amount;
      orgWallet.consumedCredits += amount; // We count allocated as consumed from the org's perspective
      await orgWallet.save({ session });

      const orgTx = new CreditTransaction({
        walletId: orgWallet._id,
        amount: amount,
        type: 'debit',
        source: 'allocation',
        description: `Allocated to teacher ${teacherWallet.ownerId}`,
        referenceId: teacherWallet.ownerId.toString()
      });
      await orgTx.save({ session });

      // 2. Credit to Teacher
      teacherWallet.totalCredits += amount;
      teacherWallet.remainingCredits += amount;
      await teacherWallet.save({ session });

      const teacherTx = new CreditTransaction({
        walletId: teacherWallet._id,
        amount: amount,
        type: 'credit',
        source: 'allocation',
        description: `Allocated by organization admin ${orgAdminId}`,
        referenceId: orgWallet.ownerId.toString()
      });
      await teacherTx.save({ session });
    });
  }

  /**
   * Checks if a wallet has enough credits to start a new lecture.
   * Assumes 1 hour (60 credits max) is required to start safely.
   */
  static async checkMinimumBalance(walletId: string, minRequired: number = 5): Promise<boolean> {
    const wallet = await CreditWallet.findById(walletId).lean();
    if (!wallet) return false;
    return wallet.remainingCredits >= minRequired;
  }

  /**
   * Safely recharges a wallet after successful payment.
   */
  static async rechargeWallet(walletId: string, creditsPurchased: number, paymentId: string, session: mongoose.ClientSession | undefined): Promise<void> {
    if (creditsPurchased <= 0) throw new AppError('Recharge amount must be positive', 400);

    const wallet = await CreditWallet.findById(walletId).session(session || null);
    if (!wallet) throw new AppError('Wallet not found for recharge', 404);

    wallet.totalCredits += creditsPurchased;
    wallet.remainingCredits += creditsPurchased;
    await wallet.save({ session });

    const tx = new CreditTransaction({
      walletId: wallet._id,
      amount: creditsPurchased,
      type: 'credit',
      source: 'recharge',
      description: `Recharged via payment ${paymentId}`,
      referenceId: paymentId
    });
    await tx.save({ session });
  }
}
