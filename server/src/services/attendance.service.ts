import { Types } from 'mongoose';
import { StaffAttendance } from '../models/staffAttendance.model';
import { User } from '../models/user.model';
import { BadRequestError } from '../utils/errors';

export class AttendanceService {
  async markAttendance(restaurantId: string, data: Record<string, unknown>, markedBy: string) {
    const userId = data['userId'] as string;
    const date = new Date(data['date'] as string);
    date.setHours(0, 0, 0, 0);

    const existing = await StaffAttendance.findOne({ restaurantId, userId, date });
    if (existing) throw new BadRequestError('Attendance already marked for this date');

    const checkIn = data['checkIn'] ? new Date(data['checkIn'] as string) : undefined;
    const checkOut = data['checkOut'] ? new Date(data['checkOut'] as string) : undefined;
    let workingMinutes = 0;
    let lateMinutes = 0;
    let overtimeMinutes = 0;

    if (checkIn && checkOut) {
      workingMinutes = Math.max(0, (checkOut.getTime() - checkIn.getTime()) / 60000);
      const standardMinutes = 8 * 60; // 8-hour shift
      if (workingMinutes > standardMinutes) overtimeMinutes = workingMinutes - standardMinutes;
    }
    if (checkIn) {
      const shiftStart = new Date(checkIn);
      shiftStart.setHours(9, 0, 0, 0); // default 9 AM shift
      if (checkIn > shiftStart) lateMinutes = (checkIn.getTime() - shiftStart.getTime()) / 60000;
    }

    return StaffAttendance.create({
      restaurantId,
      userId: new Types.ObjectId(userId),
      date,
      status: data['status'],
      checkIn,
      checkOut,
      workingMinutes: Math.round(workingMinutes),
      overtimeMinutes: Math.round(overtimeMinutes),
      lateMinutes: Math.round(lateMinutes),
      leaveType: data['leaveType'],
      notes: data['notes'],
      markedBy: new Types.ObjectId(markedBy),
    });
  }

  async updateAttendance(restaurantId: string, id: string, data: Record<string, unknown>) {
    return StaffAttendance.findOneAndUpdate(
      { _id: id, restaurantId },
      { $set: data },
      { new: true }
    );
  }

  async getDailyAttendance(restaurantId: string, date: string) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d.getTime() + 86400000);

    const [records, staff] = await Promise.all([
      StaffAttendance.find({ restaurantId, date: { $gte: d, $lt: next } })
        .populate('userId', 'firstName lastName roleId')
        .lean(),
      User.find({ restaurantId, isActive: true, isDeleted: false }).lean(),
    ]);

    const markedIds = new Set(records.map((r) => r.userId.toString()));
    const unmarked = staff.filter((s) => !markedIds.has(s._id.toString()));

    return { date: d, marked: records, unmarked, total: staff.length, present: records.filter(r => r.status === 'present' || r.status === 'late').length };
  }

  async getMonthlyReport(restaurantId: string, userId: string, year: number, month: number) {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59);

    const records = await StaffAttendance.find({
      restaurantId,
      userId: new Types.ObjectId(userId),
      date: { $gte: from, $lte: to },
    }).lean();

    const summary = {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      late: records.filter(r => r.status === 'late').length,
      halfDay: records.filter(r => r.status === 'half_day').length,
      leave: records.filter(r => r.status === 'leave').length,
      totalWorkingMinutes: records.reduce((s, r) => s + r.workingMinutes, 0),
      totalOvertimeMinutes: records.reduce((s, r) => s + r.overtimeMinutes, 0),
      totalLateMinutes: records.reduce((s, r) => s + r.lateMinutes, 0),
      attendancePercent: 0,
    };
    const workdays = records.filter(r => r.status !== 'holiday').length;
    summary.attendancePercent = workdays > 0 ? Math.round((summary.present / workdays) * 100) : 0;

    return { userId, year, month, records, summary };
  }

  async getTeamAttendanceSummary(restaurantId: string, from: Date, to: Date) {
    return StaffAttendance.aggregate([
      {
        $match: {
          restaurantId: new Types.ObjectId(restaurantId),
          date: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: '$userId',
          present: { $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } },
          totalWorkingMinutes: { $sum: '$workingMinutes' },
          totalOvertimeMinutes: { $sum: '$overtimeMinutes' },
        },
      },
      {
        $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' },
      },
      { $unwind: '$user' },
      {
        $project: {
          'user.firstName': 1, 'user.lastName': 1, 'user.email': 1,
          present: 1, absent: 1, late: 1, totalWorkingMinutes: 1, totalOvertimeMinutes: 1,
        },
      },
    ]);
  }
}

export const attendanceService = new AttendanceService();
