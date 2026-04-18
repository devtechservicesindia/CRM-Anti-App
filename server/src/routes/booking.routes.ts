import { Router } from 'express';
import { getBookings, createBooking, endBooking, cancelBooking, extendBooking } from '../controllers/booking.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getBookings);
router.post('/', authorize('ADMIN', 'STAFF'), createBooking);
router.patch('/:id/end', authorize('ADMIN', 'STAFF'), endBooking);
router.patch('/:id/cancel', authorize('ADMIN', 'STAFF'), cancelBooking);
router.patch('/:id/extend', authorize('ADMIN', 'STAFF'), extendBooking);

export default router;
