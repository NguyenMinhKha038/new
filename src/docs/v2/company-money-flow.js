import findSchema from '../commons/find.schema';

export default {
  '/s_/company-money-flow': {
    get: {
      tags: ['company money flow'],
      summary: 'admin get',
      parameters: [...findSchema]
    }
  }
};
