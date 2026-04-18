import { Router } from 'express';
import { getStations, createStation, updateStation, deleteStation } from '../controllers/station.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getStations);
router.post('/', authenticate, authorize('ADMIN'), createStation);
router.patch('/:id', authenticate, authorize('ADMIN', 'STAFF'), updateStation);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteStation);

export default router;
