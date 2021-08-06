import { Schema, model } from 'mongoose';

const daySchema = new Schema(
  {
    from: Number,
    to: Number,
    active: { type: Number, default: false }
  },
  { _id: false }
);

const workShiftsSchema = new Schema({
  work_shifts: {
    type: [daySchema]
  },
  active: {
    type: Boolean,
    default: true
  }
});

const settingSchema = new Schema({
  company_id: {
    type: Schema.Types.ObjectId,
    unique: true,
    required: true
  },
  can_order_without_product: {
    type: Boolean,
    default: false
  },
  opening_days: {
    type: {
      monday: daySchema,
      tuesday: daySchema,
      wednesday: daySchema,
      thursday: daySchema,
      friday: daySchema,
      saturday: daySchema,
      sunday: daySchema
    },
    default: {
      monday: { active: false },
      tuesday: { active: false },
      wednesday: { active: false },
      thursday: { active: false },
      friday: { active: false },
      saturday: { active: false },
      sunday: { active: false }
    }
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
    required: true
  },
  order_without_product_rate: {
    type: [
      {
        _id: false,
        from: {
          type: Number
        },
        refund_rate: {
          type: Number
        },
        discount_rate: {
          type: Number
        }
      }
    ],
    default: []
  },
  transport_fee: {
    type: [
      {
        _id: false,
        from: {
          type: Number
        },
        to: {
          type: Number
        },
        price: {
          type: Number
        }
      }
    ]
  },
  notification: {
    message: String,
    from: Number,
    to: Number
  },
  discount_transport: {
    type: [
      {
        status: { type: String, enum: ['active', 'disabled'], default: 'active' },
        order_value: Number,
        discount_rate: Number
      }
    ],
    default: []
  },
  payment_type: { type: String, enum: ['prepaid', 'postpaid'], default: 'prepaid' }
});

export default model('s_setting', settingSchema);
