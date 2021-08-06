import { limitSchema, sortSchema, pageSchema } from '../commons/find.schema';

export default {
  '/s_/company-history/admin': {
    get: {
      tags: ['company history'],
      summary: 'admin get transaction history',
      parameters: [
        limitSchema,
        sortSchema,
        pageSchema,
        {
          name: 'type',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: [
              'deposit',
              'withdraw',
              'user_pay_order',
              'pay_service_fee',
              'pay_transport_fee',
              'pay_banner_fee',
              'refund_order'
            ]
          }
        },
        {
          name: 'start_time',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'end_time',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'company_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'onModel',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          },
          description: 's_deposit_withdraw, s_mobilecards, s_transfers, s_payments, s_order, s_cart'
        }
      ],
      responses: {
        '200': {
          description: 'Status 200',
          content: {
            'application/json': {
              example: [
                {
                  _id: '5e8d8fb97075c9535af49636',
                  company_id: '5e8d3b517494ba5fc6c75bd8',
                  type: 'pay_service_fee',
                  transaction_id: '5e8d8a3c4ea5a54b02825024',
                  new_balance: 779540,
                  value: -817,
                  onModel: 's_order',
                  createdAt: '2020-04-08T08:47:53.125Z',
                  updatedAt: '2020-04-08T08:47:53.125Z',
                  __v: 0
                }
              ]
            }
          }
        }
      }
    }
  },
  '/s_/company-history/': {
    get: {
      tags: ['company history'],
      summary: 'company get transaction history',
      parameters: [
        limitSchema,
        sortSchema,
        pageSchema,
        {
          name: 'type',
          in: 'query',
          description:
            'user_pay_order, pay_service_fee, pay_transport_fee, refund_order => s_order \n | deposit, withdraw =>  s_deposit_withdraw\n | pay_banner_fee => s_banner',
          required: false,
          schema: {
            type: 'string',
            enum: [
              'deposit',
              'withdraw',
              'user_pay_order',
              'pay_service_fee',
              'pay_transport_fee',
              'refund_order',
              'pay_banner_fee'
            ]
          }
        },
        {
          name: 'start_time',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'end_time',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        '200': {
          content: {
            'application/json': {
              example: {
                _id: '5e8d8fb97075c9535af49636',
                company_id: '5e8d3b517494ba5fc6c75bd8',
                type: 'pay_service_fee',
                transaction_id: '5e8d8a3c4ea5a54b02825024',
                new_balance: 779540,
                value: -817,
                onModel: 's_order',
                createdAt: '2020-04-08T08:47:53.125Z',
                updatedAt: '2020-04-08T08:47:53.125Z',
                __v: 0
              }
            }
          }
        }
      }
    }
  }
};
