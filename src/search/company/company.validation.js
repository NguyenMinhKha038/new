import * as Joi from '@hapi/joi';

export default {
  get: {
    query: {
      limit: Joi.number().min(1).max(50),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string(),
      category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
        name: 'object id'
      })
    }
  },
  getById: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    },
    query: {
      select: Joi.string()
    }
  },
  getRate: {
    query: {
      limit: Joi.number().min(1).max(50),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string(),
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    }
  },
  company: {
    getFollow: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string()
      }
    },
    getStatistic: {
      query: {
        start_time: Joi.date(),
        end_time: Joi.date()
          // .iso()
          .min(Joi.ref('start_time'))
      }
    },
    put: {
      body: {
        name: Joi.string().max(256),
        representer: Joi.string().max(256),
        tax_code: Joi.string(),
        images: Joi.array().min(1).max(5),
        cover_image: Joi.string(),
        logo: Joi.string(),
        phone_number: Joi.string().min(6),
        email: Joi.string().email(),
        business_registration_form: Joi.array().min(1).max(2),
        address: Joi.string(),
        status: Joi.string().valid('disabled', 'pending'),
        online_sales: Joi.boolean()
      }
    },
    pin: {
      body: {
        password: Joi.string().required(),
        new_code: Joi.string().length(6).required(),
        old_code: Joi.string().length(6).required()
      }
    },
    authPin: {
      body: {
        pin: Joi.string().length(6).required()
      }
    },
    resetPin: {
      body: {
        password: Joi.string().required(),
        new_code: Joi.string().length(6).required()
      }
    }
  },
  user: {
    post: {
      body: {
        name: Joi.string().max(256).required(),
        representer: Joi.string().max(256).required(),
        category_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        tax_code: Joi.string().required(),
        images: Joi.array().max(5).min(1).required(),
        cover_image: Joi.string() /* .required() */,
        logo: Joi.string(),
        /* .required() */
        phone_number: Joi.string().min(9).required(),
        email: Joi.string().email().required(),
        business_registration_form: Joi.array().max(2).min(1).required(),
        address: Joi.string().required(),
        online_sales: Joi.boolean()
      }
    },
    follow: {
      body: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        state: Joi.string().valid('follow', 'unfollow').required()
      }
    },
    like: {
      body: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        state: Joi.string().valid('like', 'unlike').required()
      }
    },
    share: {
      body: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    view: {
      body: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    rate: {
      body: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        rate: Joi.number().valid(1, 2, 3, 4, 5).required(),
        state: Joi.string().valid(['rate', 'unrate']).required(),
        message: Joi.string().min(6).max(256)
      }
    },
    getRate: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string()
      }
    },
    getFollow: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string()
      }
    }
  },

  admin: {
    get: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso(),
        status: Joi.string().valid(['approved', 'rejected', 'pending', 'disabled', 'suspend']),
        category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        }),
        _id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        company_ids: Joi.array().items(
          Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
            name: 'object id'
          })
        )
      }
    },
    getById: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      query: {
        select: Joi.string()
      }
    },
    approve: {
      body: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        status: Joi.string().valid(['approved', 'rejected', 'pending', 'disabled', 'suspend']),
        note: Joi.string().allow('')
      }
    }
  }
};
