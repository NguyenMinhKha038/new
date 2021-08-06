import Joi from '@hapi/joi';
import reportConfig from './report.config';
import { trim } from 'lodash';

const reportValidation = {
  user: {
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        email: Joi.string().email(),
        reporter_type: Joi.string().valid(Object.keys(reportConfig.types)),
        type: Joi.string().valid([
          ...new Set([...reportConfig.types['user'], ...reportConfig.types['company']])
        ]),
        statuses: Joi.string(),
        created_from: Joi.date().iso(),
        created_to: Joi.date().iso().min(Joi.ref('created_from'))
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
        email: Joi.string().email().required(),
        language: Joi.string().valid(reportConfig.supportedLanguages),
        reporter_type: Joi.string().valid(Object.keys(reportConfig.types)).required(),
        type: Joi.string()
          .when(Joi.ref('reporter_type'), {
            is: 'user',
            then: Joi.string().valid(reportConfig.types['user'])
          })
          .when(Joi.ref('reporter_type'), {
            is: 'company',
            then: Joi.string().valid(reportConfig.types['company'])
          }),
        content: Joi.string()
          .trim()
          .min(reportConfig.contentLengths.min)
          .max(reportConfig.contentLengths.max)
          .required(),
        images: Joi.array().items(Joi.string()).max(reportConfig.maxImagesPerReport)
      }
    },
    update: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: {
        reporter_type: Joi.string().valid(Object.keys(reportConfig.types)).required(),
        type: Joi.string()
          .when(Joi.ref('reporter_type'), {
            is: 'user',
            then: Joi.string().valid(reportConfig.types['user'])
          })
          .when(Joi.ref('reporter_type'), {
            is: 'company',
            then: Joi.string().valid(reportConfig.types['company'])
          }),
        content: Joi.string()
          .trim()
          .min(reportConfig.contentLengths.min)
          .max(reportConfig.contentLengths.max),
        images: Joi.array().items(Joi.string()).max(reportConfig.maxImagesPerReport)
      }
    },
    delete: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    }
  },
  admin: {
    get: {
      query: {
        limit: Joi.number().min(1).max(50),
        page: Joi.number().min(1),
        select: Joi.string(),
        sort: Joi.string(),
        user_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        admin_id: Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' }),
        email: Joi.string().email(),
        reporter_type: Joi.string().valid(Object.keys(reportConfig.types)),
        type: Joi.string().valid([
          ...new Set([...reportConfig.types['user'], ...reportConfig.types['company']])
        ]),
        created_from: Joi.date().iso(),
        created_to: Joi.date().iso().min(Joi.ref('created_from')),
        statuses: Joi.string()
      }
    },
    getById: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    },
    confirm: {
      body: {
        report_id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required(),
        response: Joi.string()
          .trim()
          .min(reportConfig.contentLengths.min)
          .max(reportConfig.contentLengths.max)
      }
    },
    update: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      },
      body: Joi.object({
        response: Joi.string()
          .trim()
          .min(reportConfig.contentLengths.min)
          .max(reportConfig.contentLengths.max),
        status: Joi.string().valid(['hidden', 'handled']),
        hidden_reason: Joi.string().trim().min(4).max(1000)
      }).min(1)
    },
    delete: {
      params: {
        id: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' })
          .required()
      }
    }
  }
};

export default reportValidation;
