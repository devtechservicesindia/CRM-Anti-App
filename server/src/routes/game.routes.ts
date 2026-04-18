import { Router } from 'express';
import { getGames, createGame, updateGame, deleteGame } from '../controllers/game.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, getGames);
router.post('/', authenticate, authorize('ADMIN'), createGame);
router.patch('/:id', authenticate, authorize('ADMIN'), updateGame);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteGame);

export default router;
