import findSchema from '../commons/find.schema';
import { response200 } from '../commons/responses.schema';

export default {
  '/s_/notification/company': {
    get: {
      tags: ['notification'],
      summary: "company get company's notification",
      description:
        "type: 'user_receive_commission', 'company_suspend', 'company_balance_below_30', 'company_balance_below_50', 'company_deposit_success', 'company_deposit_error', 'company_withdraw_success', 'company_withdraw_error', 'company_new_order', 'company_user_pay_order', 'company_pay_transport_fee', 'user_deposit_success', 'user_deposit_error', 'user_withdraw_success' 'user_withdraw_error' 'user_buy_mobile_card_success', 'user_buy_mobile_card_fail', 'user_pay_order_success', 'user_return_commission', 'user_cancel_order_success', 'user_completed_order', 'user_delivering_order', 'user_delivered_order', 'user_rejected_order', 'user_company_canceled_order', 'user_new_product', 'user_receive_money' 'user_send_money','company_move_stock_request','company_move_stock_finished",
      parameters: [
        ...findSchema,
        {
          name: 'is_read',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'include_types',
          in: 'query',
          required: false,
          description: 'list of types, separate by commas. Higher priority than exclude_types',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'exclude_types',
          in: 'query',
          required: false,
          description: 'list of types, separate by commas',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/notification/company/mark-read': {
    post: {
      tags: ['notification'],
      parameters: [
        {
          name: '_id',
          in: 'query',
          description: 'if not exist mark as read all',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ]
    },
    responses: response200
  },
  '/s_/notification/user': {
    get: {
      tags: ['notification'],
      summary: "user get user's notification",
      description:
        "type: 'user_receive_commission', 'company_suspend', 'company_balance_below_30', 'company_balance_below_50', 'company_deposit_success', 'company_deposit_error', 'company_withdraw_success', 'company_withdraw_error', 'company_new_order', 'company_user_pay_order', 'company_pay_transport_fee', 'user_deposit_success', 'user_deposit_error', 'user_withdraw_success' 'user_withdraw_error' 'user_buy_mobile_card_success', 'user_buy_mobile_card_fail', 'user_pay_order_success', 'user_return_commission', 'user_cancel_order_success', 'user_completed_order', 'user_delivering_order', 'user_delivered_order', 'user_rejected_order', 'user_company_canceled_order', 'user_new_product', 'user_receive_money' 'user_send_money'",
      parameters: [
        ...findSchema,
        {
          name: 'is_read',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'include_types',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          },
          description: 'list of types, separate by commas. Higher priority than exclude_types'
        },
        {
          name: 'exclude_types',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          },
          description: 'list of types, separate by commas'
        }
      ],
      responses: response200
    }
  },
  '/s_/notification/user/mark-read': {
    post: {
      tags: ['notification'],
      parameters: [
        {
          name: '_id',
          in: 'query',
          description: 'if not exist mark as read all',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ]
    },
    responses: response200
  },
  '/s_/notification/user/device': {
    post: {
      tags: ['notification'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                token: {
                  type: 'string'
                },
                platform: {
                  type: 'string',
                  enum: ['mobile', 'web']
                },
                device_id: {
                  type: 'string'
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  }
};
