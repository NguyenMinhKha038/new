import findSchema, {
  idSchema,
  selectSchema,
  statusSchema,
  booleanSchema,
  textSchema
} from '../commons/find.schema';
import pathIDSchema from '../commons/path-id.schema';
import withSchema from '../commons/with-schema';
import { response200, response201 } from '../commons/responses.schema';

export default {
  '/s_/warehouse/admin/{id}': {
    get: {
      summary: 'admin get warehouse by id',
      tags: ['warehouse'],
      parameters: [pathIDSchema, selectSchema],
      responses: response200
    }
  },
  '/s_/warehouse/admin': {
    get: {
      summary: 'admin get warehouses',
      tags: ['warehouse'],
      parameters: [
        ...findSchema,
        withSchema(idSchema, { name: 'company_id' }),
        withSchema(idSchema, { name: 'manager_id' }),
        withSchema(idSchema, { name: 'type_category_id' }),
        withSchema(idSchema, { name: 'company_category_id' }),
        withSchema(statusSchema, { 'schema.enum': ['active', 'inactive', 'disabled'] }),
        withSchema(booleanSchema, { name: 'is_active_company' })
      ],
      responses: response200
    }
  },
  '/s_/warehouse/company/{id}': {
    get: {
      summary: 'company get warehouse by id',
      tags: ['warehouse'],
      parameters: [pathIDSchema, selectSchema],
      responses: response200
    },
    put: {
      tags: ['warehouse'],
      summary: 'company update info of warehouse',
      parameters: [pathIDSchema],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: textSchema,
                address: {
                  text: textSchema,
                  province: textSchema,
                  district: textSchema,
                  ward: textSchema,
                  province_code: textSchema,
                  district_code: textSchema,
                  ward_code: textSchema,
                  phone_number: textSchema,
                  manager_name: textSchema
                },
                location: textSchema,
                manager_id: withSchema(pathIDSchema, { required: false }),
                status: withSchema(textSchema, { 'schema.enum': ['active', 'inactive'] })
              },
              example: {
                name: 'WHP - 01',
                status: 'inactive'
              }
            }
          }
        }
      },
      responses: response200
    },
    delete: {
      summary: 'company delete warehouse by id',
      tags: ['warehouse'],
      parameters: [pathIDSchema],
      responses: response200
    }
  },
  '/s_/warehouse/company': {
    get: {
      summary: 'company get warehouses',
      tags: ['warehouse'],
      parameters: [
        ...findSchema,
        withSchema(idSchema, { name: 'manager_id' }),
        withSchema(idSchema, { name: 'type_category_id' }),
        withSchema(idSchema, { name: 'company_category_id' }),
        withSchema(statusSchema, { 'schema.enum': ['active', 'inactive'] })
      ],
      responses: response200
    },
    post: {
      tags: ['warehouse'],
      summary: 'company create warehouse',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: textSchema,
                address: {
                  text: textSchema,
                  province: textSchema,
                  district: textSchema,
                  ward: textSchema,
                  province_code: textSchema,
                  district_code: textSchema,
                  ward_code: textSchema,
                  phone_number: textSchema,
                  manager_name: textSchema
                },
                location: textSchema,
                manager_id: withSchema(pathIDSchema, { required: false }),
                status: withSchema(textSchema, { 'schema.enum': ['active', 'inactive'] })
              },
              example: {
                name: 'warehouse-1 <script>',
                address: {
                  province: 'Hồ Chí Minh',
                  province_code: '79',
                  district: 'Huyện Củ Chi',
                  district_code: '783',
                  ward: 'Xã Trung Lập Thượng',
                  ward_code: '27505',
                  text: 'Ấp 5',
                  manager_name: 'Le Van Luyen',
                  phone_number: '0386xxxxxx'
                },
                manager_id: '5efc109ddb241429823ac673',
                location: '11.1281708367796, 106.450942754745'
              }
            }
          }
        }
      },
      responses: response201
    }
  }
};
