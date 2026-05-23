import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { BillingController } from './billing.controller';

const router = Router();

router.use(authenticate);

router.post('/create-order', BillingController.createOrder);
router.post('/verify-payment', BillingController.verifyPayment);
router.get('/history', BillingController.getHistory);

export default router;
