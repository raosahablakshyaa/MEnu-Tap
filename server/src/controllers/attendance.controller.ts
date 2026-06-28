import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { attendanceService } from '../services/attendance.service';

export const markAttendance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendCreated(res, 'Attendance marked', await attendanceService.markAttendance(req.restaurantId!.toString(), req.body, req.user!._id.toString()));
});
export const updateAttendance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  sendSuccess(res, 'Attendance updated', await attendanceService.updateAttendance(req.restaurantId!.toString(), req.params['id'] as string, req.body));
});
export const getDailyAttendance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  sendSuccess(res, 'Daily attendance', await attendanceService.getDailyAttendance(req.restaurantId!.toString(), date));
});
export const getMonthlyReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.params;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();
  const month = parseInt(req.query.month as string) || (new Date().getMonth() + 1);
  sendSuccess(res, 'Monthly attendance report', await attendanceService.getMonthlyReport(req.restaurantId!.toString(), userId as string, year, month));
});
export const getTeamSummary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  sendSuccess(res, 'Team attendance summary', await attendanceService.getTeamAttendanceSummary(req.restaurantId!.toString(), from, to));
});
