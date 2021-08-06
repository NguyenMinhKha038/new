import { Schema, model } from 'mongoose';
import { CheckInStatuses, CheckInMallStaffStatus, CheckInRoles } from './staff-check-in.config';

const periodTimeSchema = new Schema(
  {
    from: {
      type: Number,
      required: true
    },
    to: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const staffCheckInSchema = new Schema(
  {
    staff_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    work_shift: {
      type: periodTimeSchema,
      required: true
    },
    is_finish: {
      type: Boolean,
      required: true,
      default: false
    },
    date: {
      type: Date,
      required: true
    },
    mall_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    work_schedule_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    check_in_by: {
      type: String,
      enum: Object.values(CheckInRoles)
    },
    check_in: {
      type: Date
    },
    check_out: {
      type: Date
    },
    salary_per_hour: {
      type: Number
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(CheckInStatuses),
      default: CheckInStatuses.Active
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
staffCheckInSchema.virtual('staff', {
  ref: 's_mall_staff',
  localField: 'staff_id',
  foreignField: '_id',
  justOne: true
});
staffCheckInSchema.virtual('mall', {
  ref: 's_mall',
  localField: 'mall_id',
  foreignField: '_id',
  justOne: true
});
staffCheckInSchema.virtual('work_schedule', {
  ref: 's_work_schedule',
  localField: 'work_schedule_id',
  foreignField: '_id',
  justOne: true
});
export default model('s_staff_check_in', staffCheckInSchema);
