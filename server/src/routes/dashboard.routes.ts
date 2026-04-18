import { Router } from 'express';
import { getDashboardStats, getRevenueChart, getStationUsage, getHeatmap } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/revenue', getRevenueChart);
router.get('/station-usage', getStationUsage);
router.get('/heatmap', getHeatmap);

export default router;
