import { Router } from 'express';
import { markAttendance, updateAttendance, getDailyAttendance, getMonthlyReport, getTeamSummary } from '../../controllers/attendance.controller';

const router = Router();

router.get('/daily', getDailyAttendance);
router.get('/team-summary', getTeamSummary);
router.post('/', markAttendance);
router.put('/:id', updateAttendance);
router.get('/:userId/monthly', getMonthlyReport);

export default router;
