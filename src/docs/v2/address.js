import { response200, response201 } from '../commons/responses.schema';
import pathIDSchema from '../commons/path-id.schema';

export default {
  '/s_/address/user': {
    get: {
      summary: 'get address',
      tags: ['address'],
      responses: response200
    },
    post: {
      summary: 'add address',
      tags: ['address'],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              example: {
                province: 'Hồ Chí Minh',
                district: 'Quận 6',
                ward: 'Phường 05',
                text: 'Hẻm 203 Phan Văn Khỏe',
                province_code: '79',
                district_code: '775',
                ward_code: '27361',
                receiver: 'Đoàn Công Minh',
                phone_number: '0962062515',
                is_default: true
              },
              properties: {
                province: {
                  type: 'string',
                  required: 'true'
                },
                district: {
                  type: 'string',
                  required: 'true'
                },
                ward: {
                  type: 'string',
                  required: 'true'
                },
                province_code: {
                  type: 'string',
                  required: 'true'
                },
                district_code: {
                  type: 'string',
                  required: 'true'
                },
                ward_code: {
                  type: 'string',
                  required: 'true'
                },
                receiver: {
                  type: 'string',
                  required: 'true'
                },
                phone_number: {
                  type: 'string',
                  required: 'true'
                },
                is_default: {
                  type: 'string',
                  required: 'true'
                }
              }
            }
          }
        }
      },
      responses: response201
    }
  },
  '/s_/address/user/{id}': {
    put: {
      summary: 'add address',
      tags: ['address'],
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              example: {
                province: 'Hồ Chí Minh',
                district: 'Quận Thủ Đức',
                ward: 'Phường Linh Trung',
                text: 'KTX khu B',
                receiver: 'Đoàn Công Minh',
                phone_number: '0962062515',
                is_default: true
              },
              properties: {
                province: {
                  type: 'string',
                  required: 'true'
                },
                district: {
                  type: 'string',
                  required: 'true'
                },
                ward: {
                  type: 'string',
                  required: 'true'
                },
                province_code: {
                  type: 'string',
                  required: 'true'
                },
                district_code: {
                  type: 'string',
                  required: 'true'
                },
                ward_code: {
                  type: 'string',
                  required: 'true'
                },
                receiver: {
                  type: 'string',
                  required: 'true'
                },
                phone_number: {
                  type: 'string',
                  required: 'true'
                },
                is_default: {
                  type: 'string',
                  required: 'true'
                }
              }
            }
          }
        }
      },
      responses: response200
    },
    delete: {
      summary: 'delete address',
      tags: ['address'],
      parameters: [pathIDSchema],
      responses: response200
    }
  }
};
