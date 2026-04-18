import { Router } from 'express';
import { getRewards, createReward, updateReward, redeemReward, getRedemptions, updateRedemptionStatus } from '../controllers/reward.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// Publicly available to all logged-in users (Customers included)
router.get('/', authenticate, getRewards);
router.post('/:id/redeem', authenticate, redeemReward);

// Staff/Admin only routes
router.get('/redemptions', authenticate, authorize('ADMIN', 'STAFF'), getRedemptions);
router.patch('/redemptions/:id', authenticate, authorize('ADMIN', 'STAFF'), updateRedemptionStatus);

// Admin only routes
router.post('/', authenticate, authorize('ADMIN'), createReward);
router.patch('/:id', authenticate, authorize('ADMIN'), updateReward);

export default router;
