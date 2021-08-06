export const authBearerSchema = {
  name: 'Authorization',
  in: 'header',
  required: false,
  example: 'bearer ............',
  schema: {
    type: 'string'
  }
};
