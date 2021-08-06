import { model, Schema } from 'mongoose';
import { ScheduleStatuses, AddScheduleRoles } from './work-schedule.config';

const workShiftSchema = new Schema(
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
const workScheduleSchema = new Schema(
  {
    staff_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    work_shifts: {
      type: [workShiftSchema]
    },
    mall_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(ScheduleStatuses),
      default: ScheduleStatuses.Active
    },
    add_by: {
      type: String,
      required: true,
      enum: Object.values(AddScheduleRoles)
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
workScheduleSchema.virtual('staff', {
  ref: 's_mall_staff',
  localField: 'staff_id',
  foreignField: '_id',
  justOne: true
});
workScheduleSchema.virtual('mall', {
  ref: 's_mall',
  localField: 'mall_id',
  foreignField: '_id',
  justOne: true
});

export default model('s_work_schedule', workScheduleSchema);
