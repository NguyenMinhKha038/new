import { limitSchema, sortSchema, pageSchema } from '../commons/find.schema';
import { response200 } from '../commons/responses.schema';

export default {
  '/s_/upload-images': {
    post: {
      tags: ['upload image'],
      summary: 'upload image',
      parameters: [
        {
          name: 'type',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            enum: [
              'company_logo',
              'company_cover',
              'company_images',
              'product_thumbnail',
              'product_images',
              'banner',
              'business_registration_form',
              'company_deposit'
            ]
          }
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              required: ['images'],
              properties: {
                images: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          }
        }
      },
      responses: {
        '400': {
          description: ''
        }
      }
    }
  },
  '/s_/v2/upload-images': {
    post: {
      tags: ['upload image'],
      summary: 'upload image',
      parameters: [
        {
          name: 'type',
          in: 'query',
          required: true,
          schema: {
            type: 'string',
            enum: [
              'company_logo',
              'company_cover',
              'company_images',
              'product_thumbnail',
              'product_images',
              'banner',
              'business_registration_form',
              'company_deposit',
              'category',
              'report'
            ]
          }
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              required: ['images'],
              properties: {
                images: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          }
        }
      },
      responses: {
        '400': {
          description: ''
        }
      }
    }
  },
  '/s_/upload-private-images': {
    post: {
      tags: ['upload image'],
      summary: 'upload image',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              required: ['images'],
              properties: {
                images: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          }
        }
      },
      responses: {
        '400': {
          description: ''
        }
      }
    }
  }
};
