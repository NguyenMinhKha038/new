import { limitSchema, sortSchema, pageSchema } from '../commons/find.schema';
import { response200 } from '../commons/responses.schema';

export default {
  '/s_/deposit-withdraw/user': {
    get: {
      tags: ['transaction'],
      summary: 'get transactions user',
      parameters: [
        {
          name: 'value',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        },
        {
          name: 'bank',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          description: 'success, pending, cancel',
          schema: {
            type: 'string'
          }
        },
        limitSchema,
        sortSchema,
        pageSchema,
        {
          name: 'type',
          in: 'query',
          required: false,
          description: 'deposit , withdrawal',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'PIN',
          in: 'query',
          required: false,
          description: 'required if type is "withdraw"',
          schema: {
            type: 'number'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Status 200',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/depositWithdraw/data'
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['transaction'],
      summary: 'create transaction',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'value', 'payment_type', 'user_bank_id', 'admin_bank_id', 'code'],
              properties: {
                value: {
                  type: 'number'
                },
                type: {
                  type: 'string',
                  description: 'deposit, withdraw'
                },
                user_bank_id: {
                  type: 'string',
                  description: 'required when type is withdraw'
                },
                admin_bank_id: {
                  type: 'string',
                  description: 'required when type is deposit'
                },
                PIN: {
                  type: 'string',
                  description: 'not required if type is deposit'
                },
                code: {
                  type: 'string'
                },
                payment_type: {
                  type: 'string'
                }
              }
            }
          }
        },
        required: true
      },
      responses: {
        '200': {
          description: 'Status 200',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/depositWithdraw/data'
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['transaction'],
      summary: 'update transaction',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id'],
              properties: {
                id: {
                  type: 'string'
                },
                image: {
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
  '/s_/deposit-withdraw/user/company': {
    post: {
      tags: ['transaction'],
      summary: 'create transaction',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'value',
                'payment_type',
                'full_name',
                'code',
                'admin_bank_id',
                'company_bank_id'
              ],
              properties: {
                value: {
                  type: 'number'
                },
                admin_bank_id: {
                  type: 'string',
                  description: 'required when type is deposit_company'
                },
                company_bank_id: {
                  type: 'string',
                  description: 'required when type is withdraw_company'
                },
                PIN: {
                  type: 'string',
                  description: 'not required if type is deposit'
                },
                code: {
                  type: 'string'
                },
                payment_type: {
                  type: 'string'
                }
              }
            }
          }
        },
        required: true
      },
      responses: {
        '200': {
          description: 'Status 200',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/depositWithdraw/data'
              }
            }
          }
        }
      }
    },
    get: {
      tags: ['transaction'],
      summary: 'get transactions company',
      parameters: [
        {
          name: 'value',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        },

        {
          name: 'status',
          in: 'query',
          required: false,
          description: 'success, pending, cancel',
          schema: {
            type: 'string'
          }
        },
        limitSchema,
        sortSchema,
        pageSchema,
        {
          name: 'type',
          in: 'query',
          required: false,
          description: 'deposit , withdrawal',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'start_time',
          in: 'query',
          required: false,
          schema: {
            type: 'date'
          }
        },
        {
          name: 'end_time',
          in: 'query',
          required: false,
          schema: {
            type: 'date'
          }
        }
      ],
      responses: {
        '200': {
          description: 'Status 200',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/depositWithdraw/data'
              }
            }
          }
        }
      }
    }
  },
  's_/deposit-withdraw/user/vnp-deposit': {
    post: {
      tags: ['transaction'],
      summary: 'create transaction',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'value'],
              properties: {
                value: {
                  type: 'number'
                },
                type: {
                  type: 'string',
                  enum: ['deposit', 'deposit_company']
                }
              }
            }
          }
        },
        required: true
      },
      responses: {
        '200': {
          description: 'Status 2000000',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  vnpUrl: {
                    type: 'string'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      fee: {
                        type: 'number'
                      },
                      refund: {
                        type: 'number'
                      },
                      status: {
                        type: 'string'
                      },
                      payment_type: {
                        type: 'string',
                        valid: 'vnpay'
                      },
                      sms_message: {
                        type: 'string'
                      },
                      _id: {
                        type: 'string'
                      },
                      value: {
                        type: 'number'
                      },
                      type: {
                        type: 'string',
                        enum: ['deposit', 'deposit_company']
                      },
                      code: {
                        type: 'string'
                      },
                      user_id: {
                        type: 'string'
                      },
                      old_balance: {
                        type: 'number'
                      },
                      new_balance: {
                        type: 'number'
                      },
                      createdAt: {
                        type: 'string'
                      },
                      updatedAt: {
                        type: 'string'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'client.companyNotApproved : 7000102 \n company is not approved'
        }
      }
    }
  },
  '/s_/deposit-withdraw/admin': {
    get: {
      tags: ['transaction'],
      summary: 'admin: get transaction',
      parameters: [
        {
          name: 'value',
          in: 'query',
          required: false,
          schema: {
            type: 'number'
          }
        },
        {
          name: 'bank',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'status',
          in: 'query',
          required: false,
          description: 'success, pending, canceled',
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
        },
        limitSchema,
        sortSchema,
        pageSchema,
        {
          name: 'type',
          in: 'query',
          required: false,
          description: 'deposit, withdraw',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'PIN',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/deposit-withdraw/admin/confirm': {
    put: {
      tags: ['transaction'],
      summary: 'confirm transaction',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status', 'id'],
              properties: {
                status: {
                  type: 'string',
                  description: 'success, pending, canceled',
                  valid: 'success, pending, canceld'
                },
                id: {
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
  '/s_/deposit-withdraw/admin/:id': {
    get: {
      tags: ['transaction'],
      summary: 'admin get transaction by id',
      responses: response200
    }
  }
};
