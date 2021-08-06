import { Schema, model } from 'mongoose';
import { MallStatuses } from './mall.config';
import { removeAccents } from '../../../commons/utils/utils';

const periodTimeSchema = new Schema({
  from: {
    type: Number,
    required: true
  },
  to: {
    type: Number,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
});
const workShiftsSchema = new Schema({
  work_shifts: {
    type: [periodTimeSchema]
  },
  active: {
    type: Boolean,
    default: true
  }
});
const mallSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: { text: true }
    },
    description: String,
    manager_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    address: {
      type: {
        province: String,
        district: String,
        ward: String,
        text: String,
        province_code: String,
        district_code: String,
        ward_code: String,
        phone_number: String,
        manager_name: String
      },
      required: true
    },
    location: {
      type: {
        type: String
      },
      coordinates: {
        type: []
      }
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(MallStatuses),
      default: MallStatuses.Active
    },
    pure_name: {
      type: String,
      index: { text: true }
    },
    total_revenue: {
      type: Number,
      default: 0
    },
    total_active_staffs: {
      type: Number,
      default: 0
    },
    current_products_count: {
      type: Number,
      default: 0
    },
    total_products: {
      type: Number,
      default: 0
    },
    sold_products_count: {
      type: Number,
      default: 0
    },
    phone_number: {
      type: String,
      required: true
    },
    weekly_work_shifts: {
      type: {
        monday: workShiftsSchema,
        tuesday: workShiftsSchema,
        wednesday: workShiftsSchema,
        thursday: workShiftsSchema,
        friday: workShiftsSchema,
        saturday: workShiftsSchema,
        sunday: workShiftsSchema
      },
      default: {
        monday: { active: true },
        tuesday: { active: true },
        wednesday: { active: true },
        thursday: { active: true },
        friday: { active: true },
        saturday: { active: true },
        sunday: { active: true }
      },
      required: true
    },
    working_time: {
      type: {
        monday: periodTimeSchema,
        tuesday: periodTimeSchema,
        wednesday: periodTimeSchema,
        thursday: periodTimeSchema,
        friday: periodTimeSchema,
        saturday: periodTimeSchema,
        sunday: periodTimeSchema
      },
      required: true
    },
    email: {
      type: String,
      trim: true
    },
    staff_register_schedule: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

mallSchema.virtual('manager', {
  ref: 'Users',
  localField: 'manager_id',
  foreignField: '_id',
  justOne: true
});
mallSchema.pre('save', function () {
  if (this.isModified('name')) {
    const n = this.name;
    this.pure_name = removeAccents(n);
  }
});

export default model('s_mall', mallSchema);
