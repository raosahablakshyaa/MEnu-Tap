import { Router } from 'express';
import {
  generateDailyReport, getLatestReport, getReportHistory, getSalesForecast, getExecutiveDashboard,
} from '../../controllers/ai.controller';

const router = Router();

router.get('/executive-dashboard', getExecutiveDashboard);
router.get('/forecast', getSalesForecast);
router.get('/reports/latest', getLatestReport);
router.get('/reports/history', getReportHistory);
router.post('/reports/generate', generateDailyReport);

export default router;
