import findSchema, { selectSchema, limitSchema } from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import { response200, response201 } from '../commons/responses.schema';

export default {
  '/s_/setting/company': {
    get: {
      tags: ['setting'],
      summary: 'company get company setting',
      responses: response200
    },
    post: {
      tags: ['setting'],
      summary: 'company post a setting',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                can_order_without_product: {
                  type: 'boolean'
                },
                transport_fee: {
                  deprecated: true,
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      from: {
                        type: 'number',
                        minimum: 0
                      },
                      to: {
                        type: 'number',
                        minimum: 0
                      },
                      price: {
                        type: 'number',
                        minimum: 0
                      }
                    }
                  }
                },
                opening_days: {
                  type: 'object',
                  properties: {
                    monday: {
                      type: 'object',
                      properties: {
                        from: {
                          type: 'number',
                          minimum: 0
                        },
                        to: {
                          type: 'number',
                          minimum: 0
                        },
                        active: {
                          type: 'boolean'
                        }
                      }
                    },
                    tuesday: {
                      type: 'object',
                      properties: {
                        from: {
                          type: 'number',
                          minimum: 0
                        },
                        to: {
                          type: 'number',
                          minimum: 0
                        },
                        active: {
                          type: 'boolean'
                        }
                      }
                    },
                    wednesday: {
                      type: 'object',
                      properties: {
                        from: {
                          type: 'number',
                          minimum: 0
                        },
                        to: {
                          type: 'number',
                          minimum: 0
                        },
                        active: {
                          type: 'boolean'
                        }
                      }
                    },
                    thursday: {
                      type: 'object',
                      properties: {
                        from: {
                          type: 'number',
                          minimum: 0
                        },
                        to: {
                          type: 'number',
                          minimum: 0
                        },
                        active: {
                          type: 'boolean'
                        }
                      }
                    },
                    friday: {
                      type: 'object',
                      properties: {
                        from: {
                          type: 'number',
                          minimum: 0
                        },
                        to: {
                          type: 'number',
                          minimum: 0
                        },
                        active: {
                          type: 'boolean'
                        }
                      }
                    },
                    saturday: {
                      type: 'object',
                      properties: {
                        from: {
                          type: 'number',
                          minimum: 0
                        },
                        to: {
                          type: 'number',
                          minimum: 0
                        },
                        active: {
                          type: 'boolean'
                        }
                      }
                    },
                    sunday: {
                      type: 'object',
                      properties: {
                        from: {
                          type: 'number',
                          minimum: 0
                        },
                        to: {
                          type: 'number',
                          minimum: 0
                        },
                        active: {
                          type: 'boolean'
                        }
                      }
                    }
                  }
                },
                weekly_work_shifts: {
                  type: 'object',
                  properties: {
                    monday: {
                      type: 'object',
                      properties: {
                        work_shifts: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              from: {
                                type: 'number',
                                minimum: 0
                              },
                              to: {
                                type: 'number',
                                minimum: 0
                              },
                              active: {
                                type: 'boolean'
                              }
                            }
                          }
                        },
                        active: {
                          type: 'boolean'
                        }
                      }
                    },
                    tuesday: {
                      type: 'object',
                      properties: {
                        work_shifts: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              from: {
                                type: 'number',
                                minimum: 0
                              },
                              to: {
                                type: 'number',
                                minimum: 0
                              },
                              active: {
                                type: 'boolean'
                              }
                            }
                          }
                        },
                        active: {
                          type: 'boolean'
                        }
                      }
                    },
                    wednesday: {
                      type: 'object',
                      properties: {
                        work_shifts: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              from: {
                                type: 'number',
                                minimum: 0
                              },
                              to: {
                                type: 'number',
                                minimum: 0
                              },
                              active: {
                                type: 'boolean'
                              }
                            }
                          }
                        },
                        active: {
                          type: 'boolean'
                        }
                      }
                    },
                    thursday: {
                      type: 'object',
                      properties: {
                        work_shifts: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              from: {
                                type: 'number',
                                minimum: 0
                              },
                              to: {
                                type: 'number',
                                minimum: 0
                              },
                              active: {
                                type: 'boolean'
                              }
                            }
                          }
                        },
                        active: {
                          type: 'boolean'
                        }
                      }
                    },
                    friday: {
                      type: 'object',
                      properties: {
                        work_shifts: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              from: {
                                type: 'number',
                                minimum: 0
                              },
                              to: {
                                type: 'number',
                                minimum: 0
                              },
                              active: {
                                type: 'boolean'
                              }
                            }
                          }
                        },
                        active: {
                          type: 'boolean'
                        }
                      }
                    },
                    saturday: {
                      type: 'object',
                      properties: {
                        work_shifts: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              from: {
                                type: 'number',
                                minimum: 0
                              },
                              to: {
                                type: 'number',
                                minimum: 0
                              },
                              active: {
                                type: 'boolean'
                              }
                            }
                          }
                        },
                        active: {
                          type: 'boolean'
                        }
                      }
                    },
                    sunday: {
                      type: 'object',
                      properties: {
                        work_shifts: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              from: {
                                type: 'number',
                                minimum: 0
                              },
                              to: {
                                type: 'number',
                                minimum: 0
                              },
                              active: {
                                type: 'boolean'
                              }
                            }
                          }
                        },
                        active: {
                          type: 'boolean'
                        }
                      }
                    }
                  }
                },
                notification: {
                  type: 'object',
                  properties: {
                    from: {
                      type: 'number',
                      minimum: 0
                    },
                    to: {
                      type: 'number',
                      minimum: 0
                    }
                  }
                },
                order_without_product_rate: {
                  type: 'array',
                  items: {
                    type: 'object',
                    description: 'first item must start at 0',
                    properties: {
                      from: {
                        type: 'number',
                        minimum: 0
                      },
                      refund_rate: {
                        type: 'number',
                        minimum: 0
                      },
                      discount_rate: {
                        type: 'number',
                        minimum: 0
                      }
                    }
                  }
                },
                discount_transport: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      status: {
                        type: 'string',
                        enum: ['active', 'disabled']
                      },
                      _id: {
                        type: 'string'
                      },
                      order_value: {
                        type: 'number',
                        minimum: 0
                      },
                      discount_rate: {
                        type: 'number',
                        minimum: 0,
                        maximum: 1
                      }
                    }
                  }
                }
              }
            }
          }
        },
        required: true
      },
      responses: {
        ...response201,
        '400': {
          description: "'number.startAtZero': 4000801"
        }
      }
    }
  },
  '/s_/setting/company/discount-transport': {
    post: {
      tags: ['setting'],
      summary: 'company update a discount-transport',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              description: 'maximum 3 discount',
              properties: {
                providers: {
                  type: 'array'
                },
                order_value: {
                  type: 'number',
                  minimum: 0
                },
                discount_rate: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1
                }
              },
              example: {
                providers: ['ghn'],
                order_value: 100000,
                discount_rate: 0.5
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
            "'client.logisticsIsNotValid': 7002308, client.companyDiscountTransportNumber': 7002307, 'client.companyDiscountTransportMin': 7002309"
        }
      }
    },
    put: {
      tags: ['setting'],
      summary: 'company post a discount-transport',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                providers: {
                  type: 'array'
                },
                status: {
                  type: 'string',
                  enum: ['active', 'disabled']
                },
                _id: {
                  type: 'string'
                },
                order_value: {
                  type: 'number',
                  minimum: 0
                },
                discount_rate: {
                  type: 'number',
                  minimum: 0,
                  maximum: 1
                }
              },
              example: {
                status: 'active',
                providers: ['ghn'],
                _id: '5e9195fe1db1550c8913f626',
                order_value: 50000,
                discount_rate: 0.25
              }
            }
          }
        },
        required: true
      },
      responses: {
        ...response200,
        '400': {
          description: "'client.logisticsIsNotValid': 7002308, 'client.global.notFound': 7002400"
        }
      }
    },
    delete: {
      tags: ['setting'],
      summary: 'company remove a discount-transport',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                _id: {
                  type: 'string'
                }
              },
              example: {
                _id: '5e9195fe1db1550c8913f626'
              }
            }
          }
        },
        required: true
      }
    },
    responses: response200
  },
  '/s_/setting/': {
    get: {
      tags: ['setting'],
      summary: 'company setting',
      responses: response200
    },
    parameters: [
      {
        name: 'company_id',
        in: 'query',
        required: true,
        schema: {
          type: 'string'
        }
      }
    ]
  }
};
