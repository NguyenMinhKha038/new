import { limitSchema, pageSchema, sortSchema } from '../commons/find.schema';
import { response200 } from '../commons/responses.schema';

export default {
  '/user/get-follow-status?id={id}': {
    get: {
      tags: ['user'],
      summary: 'user: get follow status',
      responses: response200
    },
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string'
        }
      }
    ]
  },
  '/user/get-user-info': {
    get: {
      tags: ['user'],
      summary: 'user: get one by id (user login)',
      responses: response200
    }
  },
  '/user/get-ref-users': {
    get: {
      tags: ['user'],
      summary: 'user: get ref users',
      parameters: [limitSchema, pageSchema, sortSchema],
      responses: response200
    }
  },
  '/user/enter-ref-code': {
    post: {
      tags: ['user'],
      summary: 'user: update ref point',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['ref_code'],
              properties: {
                ref_code: {
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
  '/user/change-pass': {
    put: {
      tags: ['user'],
      summary: 'user change pass',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['old_pass', 'new_pass'],
              properties: {
                old_pass: {
                  type: 'string'
                },
                new_pass: {
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
          errors: {
            password: '7001705',
            old_pass: ''
          },
          message: 'new password is duplicate with old password'
        },
        '500': {
          errors: {
            old_pass: '5000200'
          },
          message: 'wrong password'
        }
      }
    }
  },
  '/user/update-user-info': {
    post: {
      tags: ['user'],
      summary: 'user: update user info (user login)',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                birthday: {
                  type: 'string'
                },
                gender: {
                  type: 'string'
                },
                avatar: {
                  type: 'string',
                  description: 'image base 64 string'
                },
                about_me: {
                  type: 'string'
                },
                phone: {
                  type: 'string',
                  description: '+84......'
                },
                email: {
                  type: 'string'
                },
                PIN: {
                  type: 'string'
                },
                addresses: [
                  {
                    type: 'string'
                  }
                ],
                bank: {
                  type: 'string'
                },
                bank_account_number: {
                  type: 'string'
                },
                bank_branch: {
                  type: 'string'
                },
                user_bank_name: {
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
  '/user/update-KYC': {
    post: {
      tags: ['user'],
      summary: 'user update KYC',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'address',
                'backside_passport_image',
                'birthday',
                'front_passport_image',
                'passport_number',
                'passport_type',
                'real_name',
                'selfy_image'
              ],
              properties: {
                selfy_image: {
                  type: 'string'
                },
                front_passport_image: {
                  type: 'string'
                },
                backside_passport_image: {
                  type: 'string'
                },
                passport_number: {
                  type: 'string'
                },
                real_name: {
                  type: 'string'
                },
                passport_type: {
                  type: 'string'
                },
                address: {
                  type: 'string'
                },
                birthday: {
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
  '/user/update-KYC-raw': {
    put: {
      tags: ['user'],
      summary: 'user update KYC',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'address',
                'backside_passport_image',
                'birthday',
                'front_passport_image',
                'passport_number',
                'passport_type',
                'name',
                'selfy_image'
              ],
              properties: {
                selfy_image: {
                  type: 'string',
                  description: 'path of image'
                },
                front_passport_image: {
                  type: 'string',
                  description: 'path of image'
                },
                backside_passport_image: {
                  type: 'string',
                  description: 'path of image'
                },
                passport_number: {
                  type: 'string'
                },
                name: {
                  type: 'string'
                },
                passport_type: {
                  type: 'string',
                  enum: ['national_identity_card', 'driving_license', 'passport']
                },
                address: {
                  type: 'string'
                },
                birthday: {
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
  '/user/update-ref-point': {},
  '/user/admin/get-users': {
    get: {
      tags: ['user'],
      summary: 'user of admin path: get all users',
      parameters: [
        limitSchema,
        pageSchema,
        sortSchema,
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            enum: ['non-kyc', 'approve-kyc', 'reject-kyc', 'pending-kyc', 'disabled'],
            type: 'string'
          }
        },
        {
          name: 'phone',
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
  '/user/admin/raw-users': {
    get: {
      tags: ['user'],
      summary: 'user of admin path: get all users',
      parameters: [
        limitSchema,
        pageSchema,
        sortSchema,
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            enum: ['non-kyc', 'approve-kyc', 'reject-kyc', 'pending-kyc', 'disabled'],
            type: 'string'
          }
        },
        {
          name: 'phone',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
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
      responses: response200
    }
  },
  '/user/autho-pin': {
    post: {
      tags: ['user'],
      summary: 'user: autho pin',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['PIN'],
              properties: {
                PIN: {
                  type: 'string',
                  description: 'only number'
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
  '/user/pin': {
    post: {
      tags: ['user'],
      summary: 'user: update pin',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['old_code', 'new_code', 'password'],
              properties: {
                new_code: {
                  type: 'string',
                  description: 'only number'
                },
                old_code: {
                  type: 'string',
                  description: 'only number'
                },
                password: {
                  type: 'string',
                  description: 'only number'
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
  '/user/reset-pin': {
    put: {
      tags: ['company'],
      summary: 'company update pin',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['password', 'new_code'],
              properties: {
                new_code: {
                  type: 'string',
                  description: 'new code have 6 charactor'
                },
                password: {
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
            'company: 7000100 - company is not available \n user: 7001700 - user not available \n password: 5000200 - wrong password \n old_code: 5000603 - wrong old pin \n new_code: 7001705 - repeat pin'
        }
      }
    }
  },
  '/user/admin/get-user?id={id}': {
    get: {
      tags: ['user'],
      summary: 'user of admin path:',
      responses: response200
    },
    parameters: [
      {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string'
        }
      }
    ]
  },
  '/user/admin/get-by-status': {
    get: {
      tags: ['user'],
      summary: 'user of admin path: get users by status',
      parameters: [
        {
          name: 'status',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            enum: ['non-kyc', 'approve-kyc', 'reject-kyc', 'pending-kyc', 'disabled']
          }
        }
      ],
      responses: response200
    }
  },
  '/user/admin/:phone': {
    get: {
      tags: ['user'],
      summary: 'user of admin path:',
      responses: response200
    },
    parameters: []
  },
  '/user/admin/check-KYC': {
    post: {
      tags: ['user'],
      summary: 'user of  admin path: check KYC',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['backside_passport_status', 'front_passport_status', 'selfy_status'],
              properties: {
                selfy_status: {
                  type: 'string'
                },
                front_passport_status: {
                  type: 'string'
                },
                backside_passport_status: {
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
  '/user/admin/update-status': {
    post: {
      tags: ['user'],
      summary: 'user of admin path: update status user',
      requestBody: {
        $ref: '#/components/requestBodies/Body4'
      },
      responses: response200
    }
  }
};
