import { response200 } from '../commons/responses.schema';

export default {
  '/auth/init-server': {
    post: {
      tags: ['auth'],
      summary: 'Init server',
      responses: response200
    }
  },
  '/auth/send-sms': {
    post: {
      tags: ['auth'],
      summary: 'verify sms',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['phone', 'type'],
              properties: {
                phone: {
                  type: 'string',
                  description: ''
                },
                type: {
                  type: 'string',
                  enum: ['reset-password', 'verify']
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
          description: 'client error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  phone: {
                    type: 'string',
                    description:
                      '7001700 => user not found \n 7001707 => phone is existed  \n 7001703 => time to resend sms is not expired'
                  },
                  user: {
                    type: 'string',
                    description:
                      '7001703 => time to resend code is not expired \n 7001707 => user is existed'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/auth/raw-send-sms': {
    post: {
      tags: ['auth'],
      summary: 'verify sms',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['phone', 'type'],
              properties: {
                phone: {
                  type: 'string',
                  description: ''
                },
                type: {
                  type: 'string',
                  enum: ['reset-password', 'verify']
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
          description: 'client error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  phone: {
                    type: 'string',
                    description:
                      '7001700 => user not found \n 7001707 => phone is existed  \n 7001703 => time to resend sms is not expired'
                  },
                  user: {
                    type: 'string',
                    description:
                      '7001703 => time to resend code is not expired \n 7001707 => user is existed'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/auth/verify': {
    post: {
      tags: ['auth'],
      summary: 'verify sms',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['phone', 'type', 'code'],
              properties: {
                phone: {
                  type: 'string',
                  description: ''
                },
                type: {
                  type: 'string',
                  enum: ['reset-password', 'verify']
                },
                code: {
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
          description: 'client error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  phone: {
                    type: 'string',
                    description:
                      '7001700 => user not found \n 7001707 => phone is existed  \n 7001703 => time to resend sms is not expired'
                  },
                  user: {
                    type: 'string',
                    description:
                      '7001703 => time to resend code is not expired \n 7001707 => user is existed'
                  },
                  code: {
                    type: 'string',
                    description: '7005000 => out of max wrong times \n 7000100 => wrong input'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/auth/login-with-facebook': {
    post: {
      tags: ['auth'],
      summary: 'login with facebook',
      responses: response200
    }
  },
  '/auth/admin-login': {
    post: {
      tags: ['auth'],
      summary: 'admin login',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['password', 'user_name'],
              properties: {
                user_name: {
                  type: 'string'
                },
                password: {
                  type: 'string'
                }
              },
              description: 'user_name:'
            }
          }
        },
        required: true
      },
      responses: {
        ...response200,
        '400': {
          description: 'Status 400',
          content: {
            'application/json': {
              schema: {
                type: 'object'
              }
            }
          }
        }
      }
    }
  },
  '/auth/user-login': {
    post: {
      tags: ['auth'],
      summary: 'user-login',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['phone', 'password'],
              properties: {
                phone: {
                  type: 'string'
                },
                password: {
                  type: 'string'
                }
              },
              description: 'user login not with facebook'
            }
          }
        },
        required: true
      },
      responses: response200
    }
  },
  '/auth/user-register': {
    post: {
      tags: ['auth'],
      summary: 'user register',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'password', 'phone', 'token'],
              properties: {
                name: {
                  type: 'string'
                },
                email: {
                  type: 'string'
                },
                password: {
                  type: 'string'
                },
                phone: {
                  type: 'string',
                  description: 'if "email\' is not exist, this vlue is required'
                },
                ref_code: {
                  type: 'string',
                  description: '+84......'
                },
                token: {
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
          description: 'client error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  phone: {
                    type: 'string',
                    description: '5000201 => user is existed \n 7002400 => phone register not found'
                  },
                  user: {
                    type: 'string',
                    description: '7002400 => phone verify not found: wrong phone or wrong code'
                  },
                  ref_code: {
                    type: 'string',
                    description: '7001700 => ref user not found'
                  },
                  token: {
                    type: 'string',
                    description: '7001000 => wrong input \n 7005000 => out of max wrong times'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/auth/user-reset-password': {
    post: {
      tags: ['auth'],
      summary: 'auth: user reset password',
      requestBody: {
        $ref: '#/components/requestBodies/BodyResetPassword'
      },
      responses: {
        ...response200,
        '400': {
          description: 'client error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  user: {
                    type: 'string',
                    description: '7001700 => user not found: wrong phone'
                  },
                  token: {
                    type: 'string',
                    description: '7005000 => verify time was expired \n 7000100 => wrong token'
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
