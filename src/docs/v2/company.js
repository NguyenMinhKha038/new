import findSchema, { selectSchema } from '../commons/find.schema';
import { response200 } from '../commons/responses.schema';

export default {
  '/s_/company/': {
    get: {
      summary: 'get companies',
      tags: ['company'],
      parameters: [
        ...findSchema,
        {
          name: 'category_id',
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
  '/s_/company/{id}': {
    get: {
      summary: 'get company by id',
      tags: ['company'],
      parameters: [selectSchema],
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
  '/s_/company/admin': {
    get: {
      summary: 'admin get companies',
      tags: ['company'],
      parameters: [
        ...findSchema,
        {
          name: 'status',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['approved', 'rejected', 'pending', 'disabled']
          }
        },
        {
          name: 'category_id',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'company_ids',
          in: 'query',
          required: false,
          schema: {
            type: 'array',
            items: {
              type: 'string'
            }
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/company/admin/{id}': {
    get: {
      summary: 'admin get a company',
      tags: ['company'],
      parameters: [selectSchema],
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
  '/s_/company/admin/approve': {
    post: {
      summary: 'admin approve company',
      tags: ['company'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: {
                  type: 'string'
                },
                status: {
                  type: 'string',
                  enum: ['approved', 'rejected', 'disabled']
                },
                note: {
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
  '/s_/company/user/like': {
    post: {
      summary: 'user like a company',
      tags: ['company'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                id: {
                  type: 'string',
                  required: 'true'
                },
                state: {
                  type: 'string',
                  enum: ['like', 'unlike'],
                  required: 'true'
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/company/company/follow': {
    get: {
      summary: 'company get follow',
      tags: ['company'],
      parameters: [...findSchema],
      responses: response200
    }
  },
  '/s_/company/user/follow': {
    get: {
      summary: 'user get follow',
      tags: ['company'],
      parameters: [...findSchema],
      responses: response200
    },
    post: {
      summary: 'user follow a company',
      tags: ['company'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                id: {
                  type: 'string',
                  required: 'true'
                },
                state: {
                  type: 'string',
                  enum: ['follow', 'unfollow'],
                  required: 'true'
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/company/view': {
    post: {
      summary: 'user view a company',
      tags: ['company'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                id: {
                  type: 'string',
                  required: 'true'
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/company/rate': {
    get: {
      summary: 'public route get rate of a company',
      tags: ['company'],
      parameters: [
        {
          name: 'id',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          }
        },
        ...findSchema
      ],
      responses: response200
    }
  },
  '/s_/company/user/{id}': {
    get: {
      tags: ['company'],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            type: 'string'
          }
        }
      ],
      responses: response200
    }
  },
  '/s_/company/user': {
    get: {
      summary: 'user get personal (?)',
      tags: ['company'],
      responses: response200
    },
    post: {
      tags: ['company'],
      summary: 'user create a company',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'category_id',
                'name',
                'representer',
                'tax_code',
                'phone_number',
                'email',
                'images',
                'cover_image',
                'logo',
                'business_registration_form',
                'online_sales'
              ],
              properties: {
                name: {
                  type: 'string'
                },
                representer: {
                  type: 'string'
                },
                cover_image: {
                  type: 'string'
                },
                logo: {
                  type: 'string'
                },
                tax_code: {
                  type: 'string'
                },
                phone_number: {
                  type: 'string'
                },
                email: {
                  type: 'string'
                },
                images: {
                  type: 'array',
                  example: {
                    images: [
                      'public/uploads/s_/products/1571039354059.5d9ea88cbf370f2ff202ca5f_resized.jpg',
                      'public/uploads/s_/products/1571039354068.5d9ea88cbf370f2ff202ca5f_resized.jpg'
                    ]
                  }
                },
                business_registration_form: {
                  type: 'array',
                  example: {
                    business_registration_form: [
                      'public/uploads/s_/products/1571039354059.5d9ea88cbf370f2ff202ca5f_resized.jpg',
                      'public/uploads/s_/products/1571039354068.5d9ea88cbf370f2ff202ca5f_resized.jpg'
                    ]
                  }
                },
                category_id: {
                  type: 'string',
                  description: 'type 2'
                },
                online_sales: {
                  type: 'boolean',
                  description: 'true if online and offline'
                }
              }
            }
          }
        },
        required: true
      },
      responses: {
        ...response200,
        '403': {
          description: '7001704 - user not verified or approved '
        }
      }
    }
  },
  '/s_/company/user/share': {
    post: {
      summary: 'user share a company',
      tags: ['company'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              properties: {
                id: {
                  type: 'string',
                  required: 'true'
                }
              }
            }
          }
        }
      },
      responses: response200
    }
  },
  '/s_/company/user/rate': {
    get: {
      summary: 'user get personal rated company',
      tags: ['company'],
      parameters: [...findSchema],
      responses: response200
    },
    post: {
      tags: ['company'],
      summary: 'user rate a company',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['id', 'rate', 'message'],
              properties: {
                id: {
                  type: 'string'
                },
                rate: {
                  type: 'string',
                  enum: [1, 2, 3, 4]
                },
                message: {
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
  }
};
