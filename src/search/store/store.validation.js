import Joi from '@hapi/joi';
const pattern = new RegExp(/^([0-1][0-9]|2[0-3])h[0-5][0-9]$/);

export default {
  get: {
    query: {
      location: Joi.string().regex(/^(\-?\d+(\.\d+)?).?,\s*(\-?\d+(\.\d+)?)$/),
      limit: Joi.number().min(1).max(50),
      radius: Joi.number().min(0),
      page: Joi.number().min(1),
      select: Joi.string(),
      sort: Joi.string(),
      company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
        name: 'object id'
      }),
      type_category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
        name: 'object id'
      }),
      company_category_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
        name: 'object id'
      })
    }
  },
  getNearest: {
    query: {
      location: Joi.string().regex(/^(\-?\d+(\.\d+)?).?,\s*(\-?\d+(\.\d+)?)$/),
      company_id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, {
          name: 'object id'
        })
        .required()
    }
  },
  getById: {
    params: {
      id: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
        .required()
    }
  },
  company: {
    get: {
      query: {
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        store_ids: Joi.array().items(
          Joi.string().regex(/^[0-9a-fA-F]{24}$/, {
            name: 'object id'
          })
        ),
        status: Joi.string().valid(['active', 'disabled'])
      }
    },
    getById: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    post: {
      body: {
        name: Joi.string().max(256).trim().required(),
        description: Joi.string().min(10).max(10000),
        logo: Joi.string().trim(),
        cover_image: Joi.string().trim(),
        address: Joi.object({
          text: Joi.string().min(0).max(256).required(),
          province: Joi.string().min(0).max(48).required(),
          district: Joi.string().min(0).max(48).required(),
          ward: Joi.string().min(0).max(48).required(),
          province_code: Joi.string().min(0).max(48).required(),
          district_code: Joi.string().min(0).max(48).required(),
          ward_code: Joi.string().min(0).max(48).required(),
          phone_number: Joi.string().length(10).required(),
          manager_name: Joi.string().required()
        }).required(),
        location: Joi.string().regex(/^(\-?\d+(\.\d+)?).?,\s*(\-?\d+(\.\d+)?)$/),
        status: Joi.string().valid('active', 'disabled')
      }
    },
    put: {
      body: {
        name: Joi.string().max(256).trim(),
        description: Joi.string().min(10).max(10000),
        logo: Joi.string().trim(),
        cover_image: Joi.string().trim(),
        address: Joi.object({
          text: Joi.string().allow('').min(0).max(256).required(),
          province: Joi.string().min(0).max(48).required(),
          district: Joi.string().min(0).max(48).required(),
          ward: Joi.string().min(0).max(48).required(),
          province_code: Joi.string().min(0).max(48).required(),
          district_code: Joi.string().min(0).max(48).required(),
          ward_code: Joi.string().min(0).max(48).required(),
          phone_number: Joi.string().length(10),
          manager_name: Joi.string()
        }),
        location: Joi.string().regex(/^(\-?\d+(\.\d+)?).?,\s*(\-?\d+(\.\d+)?)$/),
        status: Joi.string().valid('active', 'disabled')
      }
    }
  },

  admin: {
    get: {
      query: {
        name: Joi.string().max(64),
        status: Joi.string().valid(['active', 'disabled']),
        limit: Joi.number().min(0).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        start_time: Joi.date().iso(),
        end_time: Joi.date().iso(),
        company_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        store_ids: Joi.array().items(
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
      }
    }
  }
};
