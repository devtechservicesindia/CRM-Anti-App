import { Router } from 'express';
import { getPayments, createPayment, getPaymentStats } from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getPayments);
router.get('/stats', authorize('ADMIN'), getPaymentStats);
router.post('/', authorize('ADMIN', 'STAFF'), createPayment);

export default router;
