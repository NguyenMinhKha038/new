import Joi from '@hapi/joi';

const daySchema = Joi.object({
  from: Joi.number().min(0).max(24),
  to: Joi.number().min(0).max(24),
  active: Joi.bool()
}).required();
const workShifts = Joi.object({
  work_shifts: Joi.array().items(daySchema).unique().min(1).required(),
  active: Joi.boolean().required()
});

export default {
  get: {
    query: {
      company_id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    }
  },
  post: {
    body: {
      can_order_without_product: Joi.bool(),
      notification: Joi.object({
        message: Joi.string().min(8).max(128),
        from: Joi.number().min(0).max(24),
        to: Joi.number().min(0).max(24)
      }),
      opening_days: Joi.object({
        monday: daySchema,
        tuesday: daySchema,
        wednesday: daySchema,
        thursday: daySchema,
        friday: daySchema,
        saturday: daySchema,
        sunday: daySchema
      }),
      order_without_product_rate: Joi.array()
        .items(
          Joi.object({
            from: Joi.number().min(0).required(),
            refund_rate: Joi.number().greater(0).max(1).required(),
            discount_rate: Joi.number().min(0).max(1).required()
          })
        )
        .unique((a, b) => a.from >= b.from),
      payment_type: Joi.string().valid('prepaid', 'postpaid'),
      weekly_work_shifts: Joi.object({
        monday: workShifts,
        tuesday: workShifts,
        wednesday: workShifts,
        thursday: workShifts,
        friday: workShifts,
        saturday: workShifts,
        sunday: workShifts
      }).required()
    }
  },
  addDiscountTransport: {
    body: {
      discount_rate: Joi.number().max(1).min(0).valid(0.25, 0.5, 1).required(),
      order_value: Joi.number().required()
    }
  },
  updateDiscountTransport: {
    body: {
      status: Joi.string().valid('active', 'disabled'),
      _id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required(),
      discount_rate: Joi.number().max(1).min(0).valid(0.25, 0.5, 1).required(),
      order_value: Joi.number().required()
    }
  },
  removeDiscountTransport: {
    body: {
      _id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    }
  }
};
