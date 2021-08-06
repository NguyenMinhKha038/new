export default {
  's_/company-bank/company': {
    post: {
      tags: ['company-bank'],
      description: 'list banks of company',
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
                },
                province_id: {
                  type: 'string'
                },
                district_id: {
                  type: 'string'
                },
                branch_id: {
                  type: 'string'
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
                $ref: '#/components/companyBankRes/data'
              }
            }
          }
        },
        '400': {
          description: 'client error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/companyBankRes/errors'
              }
            }
          }
        }
      }
    },
    get: {
      tags: ['company-bank'],
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
                  $ref: '#/components/companyBankRes/data'
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
                $ref: '#/components/companyBankRes/errors'
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['company-bank'],
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
                $ref: '#/components/companyBankRes/data'
              }
            }
          }
        },
        '400': {
          description: 'client error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/companyBankRes/errors'
              }
            }
          }
        }
      }
    }
  }
};
