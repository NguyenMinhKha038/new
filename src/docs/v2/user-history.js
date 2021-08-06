import { limitSchema, sortSchema, pageSchema } from '../commons/find.schema';
import { response200 } from '../commons/responses.schema';

export default {
  '/s_/history/user': {
    get: {
      tags: ['user history'],
      summary: 'user get transaction history',
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
            valid: [
              'deposit',
              'withdraw',
              'deposit_company',
              'withdraw_company',
              'transfer_sender',
              'transfer_receiver',
              'pay_order',
              'pay_cart',
              'pay_bill',
              'pay_topup',
              'refund',
              'fee',
              'commission',
              'return_canceled_order'
            ]
          },
          description:
            'deposit, withdraw, transfer_sender, transfer_receiver, mobile_card, pay_order, pay_cart, refund, fee, commission, return_commission, refund_failed_order, refund_canceled_order, return_refund_canceled_order'
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
          description:
            'deposit, withdraw: deposit-withdraw/user; \n transfer_sender/receiver: transfer/user; \nmobile_card: mobile-card/user;\n pay_order: order/user; \npay_cart: cart/user; \nrefund,commission,fee need onModel filed to select response schema',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  user_id: {
                    type: 'string'
                  },
                  transaction_id: {
                    type: 'object'
                  },
                  onModel: {
                    type: 'string',
                    valid:
                      's_deposit_withdraw, s_transfer, s_mobilecards, s_order, s_payments, s_cart'
                  },
                  type: {
                    type: 'string'
                  },
                  value: {
                    type: 'number'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/s_/history/admin': {
    get: {
      tags: ['user history'],
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
            valid:
              'deposit,withdraw,deposit_company,withdraw_company,transfer_sender,transfer_receiver,mobile_card,pay_order,pay_cart,payment,refund,fee,commission,return_commission,refund_failed_order,refund_canceled_order,return_refund_canceled_order'
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
          name: 'user_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  }
};
