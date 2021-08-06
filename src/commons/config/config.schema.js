import Joi from '@hapi/joi';

export const topup = {
  key: Joi.string(),
  name: Joi.string(),
  value: {
    publishers: Joi.array()
      .items({
        name: Joi.string().valid('VTT', 'VNP', 'VMS', 'VNM', 'GMB').required(),
        display_name: Joi.string().required(),
        image_path: Joi.string().required(),
        is_active: Joi.boolean().required()
      })
      .required()
      .length(5),
    amounts: Joi.array()
      .items({
        amounts: Joi.number().valid(20000, 30000, 50000, 100000, 200000, 300000, 500000),
        is_active: Joi.boolean(),
        publishers_status: Joi.object({
          VTT: Joi.boolean(),
          VNM: Joi.boolean(),
          VNP: Joi.boolean(),
          VMS: Joi.boolean(),
          GMB: Joi.boolean()
        })
      })
      .required(),
    combos: Joi.array()
      .items({
        name: Joi.string().valid('basic', 'three_month', 'six_month', 'twelve_month').required(),
        display_name: Joi.string().required(),
        months: Joi.number().valid(3, 6, 12).required(),
        is_active: Joi.boolean()
      })
      .required(),
    refund_rate: Joi.object().pattern(
      /(fast|slow)/,
      Joi.object()
        .pattern(
          /(basic|three_month|six_month|twelve_month)/,
          Joi.object()
            .pattern(
              /(VTT|VNP|VMS|VNM|GMB)/,
              Joi.object()
                .pattern(
                  /(20000|30000|50000|100000|200000|300000|500000)/,
                  Joi.number().min(0).max(1).required()
                )
                // .requiredKeys('30000', '50000', '100000', '200000', '300000', '500000')
                .required()
            )
            // .requiredKeys('VTT', 'VNP', 'VMS', 'VNM', 'GMB')
            .required()
        )
        // .requiredKeys('basic', 'three_month', 'six_month', 'twelve_month')
        .required()
    )
  }
};

export const bill_finance = {
  key: Joi.string(),
  name: Joi.string(),
  value: {
    publishers: Joi.array().items({
      is_active: Joi.boolean().required(),
      name: Joi.string().required(),
      display_name: Joi.string().required(),
      payment_fee: Joi.number()
    })
  }
};

export const bill_water = {
  key: Joi.string(),
  name: Joi.string(),
  value: {
    payment_fee: Joi.number(),
    publishers: Joi.array().items({
      is_active: Joi.boolean().required(),
      name: Joi.string().required(),
      display_name: Joi.string().required()
    })
  }
};

export const bill_electric = {
  key: Joi.string(),
  name: Joi.string(),
  value: {
    publishers: Joi.array().items({
      is_active: Joi.boolean().required(),
      name: Joi.string().required(),
      display_name: Joi.string().required(),
      logo: Joi.string().required(),
      description: Joi.string().required()
    })
  }
};

export const lucky_shopping_hours = {
  key: Joi.string(),
  name: Joi.string(),
  value: {
    sale_start_hour: Joi.number().integer().max(23).required(),
    sale_end_hour: Joi.number().integer().max(23).required()
  }
};

export const logistics_providers = {
  key: Joi.string(),
  name: Joi.string(),
  value: Joi.array().items({
    provider: Joi.string().required(),
    display_name: Joi.string().required(),
    logo: Joi.string().required()
  })
};

export const user_level = {
  key: Joi.string(),
  name: Joi.string(),
  value: Joi.array().items({
    level: Joi.string().required(),
    total_deposit: Joi.number().required(),
    refund_rate: Joi.number().max(1).min(0).required()
  })
};

export const transfer = {
  key: Joi.string(),
  name: Joi.string(),
  value: Joi.array().items({
    value: Joi.number().required(),
    refund: Joi.number().required()
  }),
  fee: Joi.number(),
  min: Joi.number(),
  max_per_day: Joi.number()
};

export const commission_rate = {
  key: Joi.string(),
  name: Joi.string(),
  value: Joi.number().max(1).min(0).required()
};

export const maximum_canceled_order = {
  key: Joi.string(),
  name: Joi.string(),
  value: {
    paid_oder: Joi.number().integer().required(),
    unpaid_oder: Joi.number().integer().required()
  }
};

export const banner = {
  key: Joi.string(),
  name: Joi.string(),
  value: {
    banner_fee: Joi.array().items({
      position: Joi.valid(1, 2, 3, 4, 5).required(),
      fee: Joi.number().integer().required()
    }),
    max_hours: Joi.number().integer().positive().required(),
    pending_hours: Joi.number().integer().positive().required()
  }
};

export const company_limit = {
  key: Joi.string(),
  name: Joi.string(),
  value: Joi.array().items({
    level: Joi.number().integer().required(),
    product_refund: Joi.number().integer().required(),
    total_refund: Joi.number().integer(),
    balance: Joi.number().integer(),
    max_withdrawal: Joi.number().integer()
  })
};

export const banks = {
  key: Joi.string(),
  name: Joi.string(),
  value: Joi.array().items({
    name: Joi.string().required(),
    image_path: Joi.string().required()
  })
};

export const withdraw = {
  key: Joi.string(),
  name: Joi.string(),
  value: Joi.array().items({
    value: Joi.number().integer().required(),
    refund: Joi.number().integer().required()
  }),
  fee: Joi.number(),
  min: Joi.number(),
  max_per_day: Joi.number()
};

export const withdraw_company = withdraw;

export const deposit_company = {
  key: Joi.string(),
  name: Joi.string(),
  value: Joi.array().items({
    value: Joi.number().integer().required(),
    refund: Joi.number().integer().required()
  })
};
export const deposit = deposit_company;

export const db_version = { key: Joi.string(), name: Joi.string(), value: Joi.number() };

export const payment_gateway = {
  key: Joi.string(),
  name: Joi.string(),
  value: Joi.array().items({
    is_active: Joi.boolean().required(),
    name: Joi.string().required(),
    display_name: Joi.string().required(),
    deposit: Joi.bool().required(),
    pay_cart: Joi.bool().required(),
    pay_order_offline: Joi.bool().required(),
    passive_pay_order_offline: Joi.bool().required()
  })
};

export const app_version = {
  key: Joi.string(),
  name: Joi.string(),
  value: {
    enterprise_web: Joi.string().required()
  }
};
