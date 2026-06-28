import { Schema, model, Document, Types } from 'mongoose';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'holiday';
export type LeaveType = 'casual' | 'sick' | 'earned' | 'unpaid';

export interface IStaffAttendance extends Document {
  restaurantId: Types.ObjectId;
  userId: Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  checkIn?: Date;
  checkOut?: Date;
  workingMinutes: number;
  overtimeMinutes: number;
  lateMinutes: number;
  leaveType?: LeaveType;
  notes?: string;
  markedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const staffAttendanceSchema = new Schema<IStaffAttendance>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half_day', 'leave', 'holiday'],
      required: true,
    },
    checkIn: { type: Date },
    checkOut: { type: Date },
    workingMinutes: { type: Number, default: 0, min: 0 },
    overtimeMinutes: { type: Number, default: 0, min: 0 },
    lateMinutes: { type: Number, default: 0, min: 0 },
    leaveType: { type: String, enum: ['casual', 'sick', 'earned', 'unpaid'] },
    notes: { type: String, trim: true },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

staffAttendanceSchema.index({ restaurantId: 1, userId: 1, date: 1 }, { unique: true });
staffAttendanceSchema.index({ restaurantId: 1, date: -1 });

export const StaffAttendance = model<IStaffAttendance>('StaffAttendance', staffAttendanceSchema);
