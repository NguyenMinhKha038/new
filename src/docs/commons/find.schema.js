export const limitSchema = {
  name: 'limit',
  in: 'query',
  required: false,
  schema: {
    type: 'number'
  }
};

export const pageSchema = {
  name: 'page',
  in: 'query',
  required: false,
  schema: {
    type: 'number'
  }
};

export const selectSchema = {
  name: 'select',
  in: 'query',
  required: false,
  schema: {
    type: 'string'
  }
};

export const sortSchema = {
  name: 'sort',
  in: 'query',
  required: false,
  schema: {
    type: 'string'
  }
};

export const populateSchema = {
  name: 'populate',
  in: 'query',
  required: false,
  schema: {
    type: 'string'
  }
};

export const idSchema = {
  name: 'id',
  in: 'query',
  required: false,
  schema: {
    type: 'string'
  }
};

export const statusSchema = {
  name: 'status',
  in: 'query',
  required: false,
  schema: {
    type: 'string',
    enum: ['active', 'disabled']
  }
};

export const booleanSchema = {
  name: 'field_name',
  in: 'query',
  required: false,
  schema: {
    type: 'boolean'
  }
};

export const textSchema = {
  name: 'field_name',
  in: 'query',
  required: false,
  schema: {
    type: 'string'
  }
};

export const numberSchema = {
  name: 'field_name',
  in: 'query',
  required: false,
  schema: {
    type: 'number'
  }
};

export const isoDateSchema = {
  name: 'field_name',
  in: 'query',
  required: false,
  schema: {
    type: 'iso date'
  }
};

export default [limitSchema, pageSchema, sortSchema, selectSchema];
