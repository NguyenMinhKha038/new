import { model, Schema } from 'mongoose';
import { ScheduleStatuses, AddScheduleRoles } from './company-schedule.config';

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
const companyScheduleSchema = new Schema(
  {
    permission_group_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    user_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    store_id: {
      type: Schema.Types.ObjectId
    },
    date: {
      type: Date,
      required: true
    },
    work_shifts: {
      type: [workShiftSchema]
    },
    company_id: {
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
companyScheduleSchema.virtual('user', {
  ref: 'Users',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});
companyScheduleSchema.virtual('staff', {
  ref: 's_permission_group',
  localField: 'permission_group_id',
  foreignField: '_id',
  justOne: true
});
companyScheduleSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

export default model('s_company_schedule', companyScheduleSchema);
