import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../../../config/env';
import { AppError } from '../../../utils/AppError';

class RazorpayProvider {
  private razorpay: Razorpay | null = null;
  private isMockMode: boolean = false;

  constructor() {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (key_id && key_secret) {
      this.razorpay = new Razorpay({
        key_id,
        key_secret,
      });
    } else {
      console.warn('[Billing] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in .env. Running in Mock Mode for local demo.');
      this.isMockMode = true;
    }
  }

  /**
   * Creates a Razorpay Order
   */
  async createOrder(amountInr: number, receiptId: string): Promise<any> {
    if (this.isMockMode) {
      // Return a simulated order payload for local demo
      return {
        id: `order_mock_${Date.now()}`,
        entity: 'order',
        amount: amountInr * 100, // Razorpay uses paise
        amount_paid: 0,
        amount_due: amountInr * 100,
        currency: 'INR',
        receipt: receiptId,
        status: 'created',
        attempts: 0,
        created_at: Math.floor(Date.now() / 1000)
      };
    }

    if (!this.razorpay) throw new AppError('Razorpay is not initialized', 500);

    const options = {
      amount: amountInr * 100, // amount in the smallest currency unit
      currency: 'INR',
      receipt: receiptId
    };

    return new Promise((resolve, reject) => {
      this.razorpay!.orders.create(options, (err, order) => {
        if (err) return reject(new AppError('Failed to create Razorpay order', 500));
        resolve(order);
      });
    });
  }

  /**
   * Verifies the Razorpay Signature sent from the frontend
   */
  verifySignature(orderId: string, paymentId: string, signature: string): boolean {
    if (this.isMockMode) {
      // In mock mode, if signature matches a dummy check, we pass it.
      // E.g., if frontend sends a 'mock_signature', we accept it.
      return signature.includes('mock');
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) throw new AppError('Razorpay secret not configured', 500);

    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  }
}

export const razorpayProvider = new RazorpayProvider();
