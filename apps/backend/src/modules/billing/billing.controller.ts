import { Request, Response } from 'express';
import { BillingService } from './billing.service';
import { AppError } from '../../utils/AppError';
import { BillingPayment } from '../../models/BillingPayment';
import { CreditTransaction } from '../../models/CreditTransaction';
import { WalletService } from '../wallet/wallet.service';
import { User } from '../../models/User';

export class BillingController {
  static async createOrder(req: Request, res: Response) {
    const { packageId } = req.body;
    const user = req.user!;
    
    if (!packageId) throw new AppError('Package ID is required', 400);
    
    // Determine the purchasing entity and wallet based on account type
    let purchaserId = user.id;
    let purchaserType: 'individual' | 'organization' = 'individual';
    let walletId = user.walletId;

    if (user.accountType === 'organization_member' && user.organizationId) {
      if (user.role !== 'org_admin') {
        throw new AppError('Only organization admins can purchase institutional credits', 403);
      }
      // Assuming we need to fetch the org wallet ID if not on the user, but User model has a walletId.
      // Wait, User.walletId is their *personal* or *assigned* wallet?
      // An org_admin might have the org's walletId, or we might need to fetch the Organization.
      // For simplicity, we assume org_admin's walletId points to the org wallet if they are operating as the org.
      // Let's explicitly fetch Organization to be safe.
      const { Organization } = await import('../../models/Organization');
      const org = await Organization.findById(user.organizationId).lean();
      if (!org) throw new AppError('Organization not found', 404);
      
      purchaserId = org._id.toString();
      purchaserType = 'organization';
      walletId = org.walletId.toString();
    } else if (!walletId) {
      // Legacy independent teacher fallback: Create a personal wallet if they don't have one
      const wallet = await WalletService.createWallet('individual', user.id, 0);
      walletId = wallet._id.toString();
      // Update the user
      await User.findByIdAndUpdate(user.id, { walletId });
    }

    if (!walletId) throw new AppError('Wallet not found for user', 400);

    const orderPayload = await BillingService.createOrder(packageId, purchaserId, purchaserType, walletId);

    res.json({
      success: true,
      data: orderPayload
    });
  }

  static async verifyPayment(req: Request, res: Response) {
    const { internalPaymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!internalPaymentId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new AppError('Missing verification parameters', 400);
    }

    const success = await BillingService.verifyPayment(
      internalPaymentId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    res.json({
      success,
      message: success ? 'Payment verified successfully' : 'Payment verification failed'
    });
  }

  static async getHistory(req: Request, res: Response) {
    const user = req.user!;
    let walletId = user.walletId;

    // Determine context
    if (user.accountType === 'organization_member' && user.organizationId && user.role === 'org_admin') {
      const { Organization } = await import('../../models/Organization');
      const org = await Organization.findById(user.organizationId).lean();
      if (org) {
        walletId = org.walletId.toString();
      }
    } else if (!walletId) {
      // Legacy independent teacher fallback: Create a personal wallet if they don't have one
      const wallet = await WalletService.createWallet('individual', user.id, 0);
      walletId = wallet._id.toString();
      // Update the user
      await User.findByIdAndUpdate(user.id, { walletId });
    }

    if (!walletId) throw new AppError('Wallet not found', 400);

    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const [transactions, total, wallet] = await Promise.all([
      CreditTransaction.find({ walletId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('amount type source description referenceId createdAt') // Lean projection
        .lean(),
      CreditTransaction.countDocuments({ walletId }),
      import('../../models/CreditWallet').then(m => m.CreditWallet.findById(walletId).select('remainingCredits').lean())
    ]);

    res.json({
      success: true,
      data: {
        walletBalance: wallet?.remainingCredits || 0,
        transactions,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit)
        }
      }
    });
  }
}
