import { response200 } from '../commons/responses.schema';

export default {
  '/s_/bank/banks': {
    get: {
      tags: ['banks'],
      summary: '',
      parameters: [],
      responses: response200
    }
  },
  '/s_/bank/provinces': {
    get: {
      tags: ['banks'],
      summary: 'get province list of bank',
      parameters: [
        {
          name: 'bank_id',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/bank/districts': {
    get: {
      tags: ['banks'],
      summary: 'get district list of bank',
      parameters: [
        {
          name: 'bank_id',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'province_id',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/bank/branches': {
    get: {
      tags: ['banks'],
      summary: 'get district list of bank',
      parameters: [
        {
          name: 'bank_id',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'province_id',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'district_id',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  }
};
