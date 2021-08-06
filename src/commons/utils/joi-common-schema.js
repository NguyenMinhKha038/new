import Joi from '@hapi/joi';

// Schemas
export const limitSchema = Joi.number().min(0).max(50);
export const pageSchema = Joi.number().min(1);
export const selectSchema = Joi.string().trim();
export const sortSchema = Joi.string().trim();
export const pathIdSchema = Joi.string().regex(/^[0-9a-fA-F]{24}$/, { name: 'object id' });
export const textSchema = Joi.string().trim();
export const numberSchema = Joi.number();
export const integerSchema = Joi.number().integer();
export const booleanSchema = Joi.boolean();
export const isoDateSchema = Joi.date().iso();

// Utility funcs
export const getFindSchema = () => ({
  limit: limitSchema,
  sort: sortSchema,
  page: pageSchema,
  select: selectSchema,
  populate: textSchema
});

export default {
  // Schemas
  limitSchema,
  pageSchema,
  selectSchema,
  sortSchema,
  pathIdSchema,
  textSchema,
  numberSchema,
  integerSchema,
  isoDateSchema,

  // Utils
  getFindSchema
};
