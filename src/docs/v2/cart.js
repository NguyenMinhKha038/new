import findSchema from '../commons/find.schema';
import { response200, response201 } from '../commons/responses.schema';

export default {
  '/s_/cart/user': {
    get: {
      tags: ['cart'],
      summary: 'user get cart',
      responses: {
        '200': {
          description: 'Status 200',
          content: {
            'application/json': {
              schema: {
                delivery_address: {
                  province: 'Hồ Chí Minh',
                  district: 'Quận 9',
                  ward: 'Phường Phước Long B',
                  text: 'Hẻm 203 Phan Văn Khỏe',
                  receiver: 'Đoàn Công Minh',
                  phone_number: '0962062515',
                  normalizedAddress:
                    'Hẻm 203 Phan Văn Khỏe, Phường Phước Long B, Quận 9, Hồ Chí Minh',
                  address_id: '5e9185ace45132738dbb7702'
                },
                is_confirmed: true,
                is_checkouted: true,
                _id: '5e99790696b743651939da05',
                user_id: '5e5f2a19ee81e04d90580998',
                __v: 1,
                code: 'Q8XERQWF3S',
                createdAt: '2020-04-17T09:38:14.082Z',
                orders: [
                  {
                    logistics_available: [],
                    products: [
                      {
                        quantity: 2,
                        _id: '5e96b3901181235f7514abfb',
                        id: '5e96b3901181235f7514abfa',
                        company_id: '5e8d3b517494ba5fc6c75bd8',
                        discount: 0,
                        discount_rate: 0,
                        final_price: 30000,
                        original_price: 30000,
                        original_total: 60000,
                        refund: 3000,
                        refund_rate: 0.1,
                        store_id: '5e8d3c4e0eaf9b608f031c3a',
                        total: 60000,
                        total_discount: 0,
                        total_refund: 6000,
                        true_total_refund: 5400,
                        true_refund_rate: 0.09
                      }
                    ],
                    _id: '5e8d3b517494ba5fc6c75bd8',
                    company_id: '5e8d3b517494ba5fc6c75bd8',
                    calculated_transport_fee: 37400,
                    is_discount_transport: true,
                    logistics_info: {
                      FromDistrictID: 1454,
                      ToDistrictID: 1451,
                      Weight: 20,
                      Length: 20,
                      Width: 20,
                      Height: 20,
                      FromWardCode: '21201',
                      ToWardCode: '20909',
                      ServiceID: 53320
                    },
                    logistics_provider: 'ghn',
                    original_total: 60000,
                    store_id: '5e8d3c4e0eaf9b608f031c3a',
                    total: 88050,
                    total_discount: 0,
                    total_refund: 6000,
                    transport_fee: 28050,
                    store_address: {
                      province: 'Hồ Chí Minh',
                      district: 'Quận 12',
                      ward: 'Phường An Phú Đông',
                      ward_code: '3447',
                      district_code: '5433',
                      province_code: '79',
                      text: '48 Bình Phú',
                      normalizedAddress: '48 Bình Phú, Phường An Phú Đông, Quận 12, Hồ Chí Minh'
                    },
                    true_total_refund: 5400,
                    id: '5e8d3b517494ba5fc6c75bd8'
                  }
                ],
                updatedAt: '2020-04-17T09:43:46.246Z',
                payment_method: 'WALLET',
                is_paid: true,
                original_total: 60000,
                total: 88050,
                total_discount: 0,
                total_refund: 6000,
                total_transport_fee: 28050,
                true_total_refund: 5400
              }
            }
          }
        }
      }
    }
  },
  '/s_/cart/user/lucky': {
    post: {
      tags: ['cart', 'lucky-shopping'],
      summary: 'user get lucky cart',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['product_storing_id', 'company_id'],
              properties: {
                product_id: {
                  type: 'string'
                },
                company_id: {
                  type: 'string'
                },
                quantity: {
                  type: 'string',
                  default: '1'
                },
                has_promotion: {
                  type: 'boolean'
                }
              }
            }
          }
        },
        required: true
      },
      responses: {
        ...response200,
        '400': {
          description: '7001300 - product not found \n 7001416 - store out of stock'
        },
        '403': {
          description:
            "'client.productIsNotTransportable': 7002303 \n 'client.companyNotExist': 7000100 \n 'client.logisticsIsUnavailable': 7002302"
        }
      }
    }
  },
  '/s_/cart/user/lucky/confirm': {
    post: {
      tags: ['cart', 'lucky-shopping'],
      summary: 'user confirm lucky cart',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['product_storing_id', 'company_id'],
              properties: {
                product_id: {
                  type: 'string'
                },
                company_id: {
                  type: 'string'
                },
                quantity: {
                  type: 'string',
                  default: '1'
                },
                address_id: {
                  type: 'string'
                }
              }
            }
          }
        },
        required: true
      },
      responses: {
        ...response200,
        '400': {
          description:
            "7001300 - product not found \n 7001416 - store out of stock 'client.addressNotFound': 7001411, 'client.companyNotExist': 7000100"
        }
      }
    },
    delete: {
      tags: ['cart'],
      summary: 'user remove product to cart',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['product_storing_id', 'company_id'],
              properties: {
                product_id: {
                  type: 'string'
                },
                company_id: {
                  type: 'string'
                }
              }
            }
          }
        },
        required: true
      },
      responses: response200
    }
  },
  '/s_/cart/user/product': {
    post: {
      tags: ['cart'],
      summary: 'user add product to cart',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['product_storing_id', 'company_id'],
              properties: {
                product_id: {
                  type: 'string'
                },
                company_id: {
                  type: 'string'
                },
                quantity: {
                  type: 'string',
                  default: '1'
                },
                has_promotion: {
                  type: 'boolean'
                }
              }
            }
          }
        },
        required: true
      },
      responses: {
        ...response200,
        '400': {
          description: '7001300 - product not found \n 7001416 - store out of stock'
        },
        '403': {
          description:
            "'client.productIsNotTransportable': 7002303 \n 'client.companyNotExist': 7000100 \n 'client.logisticsIsUnavailable': 7002302"
        }
      }
    },
    delete: {
      tags: ['cart'],
      summary: 'user remove product to cart',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['product_storing_id', 'company_id'],
              properties: {
                product_id: {
                  type: 'string'
                },
                company_id: {
                  type: 'string'
                }
              }
            }
          }
        },
        required: true
      },
      responses: response200
    }
  },
  '/s_/cart/user/checkout': {
    post: {
      tags: ['cart'],
      summary: 'user checkout cart',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                address_id: {
                  type: 'string'
                },
                payment_method: {
                  type: 'string',
                  enum: ['WALLET', 'COD', 'VNPAY']
                },
                order: {
                  type: 'object',
                  properties: {
                    logistics_provider: { type: 'string' },
                    company_id: { type: 'string' },
                    store_id: { type: 'string' },
                    is_received_at_store: { type: 'boolean' },
                    expected_received_date: { type: 'string' },
                    note: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        required: true
      },
      responses: {
        ...response200,
        '400': {
          description:
            "'client.cartNotExist': 7001409\n 'client.cartIsEmpty': 7001403 \n 'client.addressNotFound': 7001411 \n"
        },
        '403': {
          description:
            "'client.logisticsIsUnavailable': 7002302 \n, client.orderCanOnlyReceivedAtStore': 7001423"
        }
      }
    }
  },
  '/s_/cart/user/confirm': {
    post: {
      tags: ['cart'],
      summary: 'user confirm cart',
      responses: {
        ...response200,
        '400': {
          description:
            "'client.cartNotExist': 7001409\n 'client.cartNotCheckouted': 7001402\n 'client.companyNotExist': 7000100 "
        },
        '403': {
          description: "'client.MoneyNotEnough': 7000610 \n'client.RefundFundNotEnough': 7000611"
        }
      }
    }
  },
  '/s_/cart/user/list': {
    get: {
      tags: ['cart'],
      summary: 'user get cart list',
      parameters: [...findSchema],
      responses: response200
    }
  }
};
