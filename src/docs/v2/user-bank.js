export default {
  's_/user-bank/user': {
    post: {
      tags: ['user-bank'],
      description: 'list banks of user',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                name: {
                  type: 'string',
                  required: 'true',
                  description: 'name of bank'
                },
                branch: {
                  type: 'string',
                  required: 'true'
                },
                account_name: {
                  type: 'string',
                  required: 'true',
                  description: 'recommend to uppercase'
                },
                account_number: {
                  type: 'number',
                  required: 'true'
                },
                is_default: {
                  type: 'boolean'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Status 200',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/userBankRes/data'
              }
            }
          }
        },
        '400': {
          description: 'client error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/userBankRes/errors'
              }
            }
          }
        }
      }
    },
    get: {
      tags: ['user-bank'],
      description: 'user get personal bank',
      parameters: [],
      responses: {
        '200': {
          description: 'Status 200',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/userBankRes/data'
                }
              }
            }
          }
        },
        '400': {
          description: 'client error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/userBankRes/errors'
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['user-bank'],
      description: 'list banks of user',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                bank_id: {
                  type: 'string',
                  required: 'true'
                },
                name: {
                  type: 'string',
                  description: 'name of bank'
                },
                branch: {
                  type: 'string'
                },
                account_name: {
                  type: 'string',
                  description: 'recommend to uppercase'
                },
                account_number: {
                  type: 'number'
                },
                is_default: {
                  type: 'boolean'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Status 200',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/userBankRes/data'
              }
            }
          }
        },
        '400': {
          description: 'client error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/userBankRes/errors'
              }
            }
          }
        }
      }
    }
  }
};
