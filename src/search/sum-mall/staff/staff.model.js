import { model, Schema } from 'mongoose';
import { MallStaffStatuses, MallStaffRoles, DayOfWeek } from './staff.config';
import { removeAccents } from '../../../commons/utils/utils';

const workShiftSchema = new Schema({
  from: {
    type: Number,
    required: true
  },
  to: {
    type: Number,
    required: true
  }
});

const mallStaffSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      index: { text: true }
    },
    user_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    mall_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    status: {
      type: String,
      required: true,
      default: 'active',
      enum: Object.values(MallStaffStatuses)
    },
    roles: {
      type: [String],
      required: true,
      enum: Object.values(MallStaffRoles)
    },
    pure_name: {
      type: String,
      index: { text: true }
    },
    salary_per_hour: {
      type: Number,
      required: true,
      default: 0
    },
    schedule: {
      type: {
        monday: [workShiftSchema],
        tuesday: [workShiftSchema],
        wednesday: [workShiftSchema],
        thursday: [workShiftSchema],
        friday: [workShiftSchema],
        saturday: [workShiftSchema],
        sunday: [workShiftSchema]
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

mallStaffSchema.pre('save', function () {
  if (this.isModified('name')) {
    const n = this.name;
    this.pure_name = removeAccents(n);
  }
});

mallStaffSchema.virtual('mall', {
  ref: 's_mall',
  localField: 'mall_id',
  foreignField: '_id',
  justOne: true
});
mallStaffSchema.virtual('user', {
  ref: 'Users',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

mallStaffSchema.pre('save', function () {
  if (this.isModified('name')) {
    const n = this.name;
    this.pure_name = removeAccents(n);
  }
});
export default model('s_mall_staff', mallStaffSchema);
