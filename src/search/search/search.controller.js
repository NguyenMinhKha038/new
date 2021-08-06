import elasticService from '../../commons/elastic/elastic.service';
import permissionGroupService from '../permission-group/permission-group.service';
import {
  BaseResponse,
  BaseError,
  errorCode,
  mergeObject,
  splitString,
  logger
} from '../../commons/utils';
import { searchService } from './search.service';
import searchConfig from './search.config';
import { handleXss, removeAccents } from '../../commons/utils/utils';

export default {
  async get(req, res, next) {
    try {
      let {
        query = '',
        sort = 'max_discount',
        type_category_id,
        province_code,
        location,
        distance,
        type = 'all',
        group_store = false,
        size,
        in_menu = false,
        from
      } = req.query;
      let productSortQuery, storeSortQuery;
      //remove reserved character
      query = query.replace(/[<>]/g, ``).replace(/([+\-=&|><!(){}[\]^"~*?:\\/])/g, `\\$1`);
      productSortQuery = sort === 'max_refund' && 'total_refund_rate';
      !productSortQuery && (productSortQuery = sort === 'max_discount' && 'discount_rate');
      storeSortQuery = sort === 'max_refund' && 'max_refund_rate';
      !storeSortQuery && (storeSortQuery = sort === 'max_discount' && 'max_discount_rate');
      const [lat, long] = (location && splitString(location)) || [];
      const param = mergeObject(
        {},
        {
          must: [
            query
              ? {
                  query_string: {
                    query: query,
                    fields: ['product_id.name^2', '*name^1'],
                    analyzer: 'vi',
                    minimum_should_match: 10
                  }
                }
              : {
                  match_all: { boost: 1.2 }
                },
            ...(type_category_id
              ? [
                  {
                    multi_match: {
                      query: type_category_id,
                      fields: ['*type_category_id._id']
                    }
                  }
                ]
              : []),
            ...(province_code
              ? [
                  {
                    multi_match: {
                      query: province_code,
                      fields: ['*address.province_code']
                    }
                  }
                ]
              : []),
            {
              match_phrase: {
                showable: true
              }
            }
          ]
        },
        location && {
          filter: [
            {
              geo_distance: {
                distance: distance + 'km',
                coordinates: [+long, +lat]
              }
            }
          ]
        }
      );

      let storingQuery = JSON.parse(JSON.stringify(param));
      storingQuery.must.push({
        multi_match: {
          query: in_menu,
          fields: ['in_menu']
        }
      });

      let data;
      if (type === 'all') {
        const [store, product] = await Promise.all([
          elasticService.client.search({
            size: 3,
            index: 's_stores',
            body: {
              query: {
                bool: param
              },
              from,
              size,
              ...(group_store
                ? {
                    collapse: {
                      field: 'company_id._id'
                    }
                  }
                : {})
              // ...(sort
              //   ? {
              //       sort: [
              //         {
              //           [storeSortQuery]: {
              //             order: 'desc'
              //           }
              //         }
              //       ]
              //     }
              //   : {})
            }
          }),
          elasticService.client.search({
            size: 10,
            index: 's_product_storings',
            body: {
              query: {
                bool: storingQuery
              },
              from,
              size,
              ...(!location
                ? {
                    collapse: {
                      field: 'product_id._id'
                    }
                  }
                : {})
              // ...(sort
              //   ? {
              //       sort: [
              //         {
              //           [productSortQuery]: {
              //             order: 'desc'
              //           }
              //         }
              //       ]
              //     }
              //   : {})
            }
          })
        ]);
        data = store.hits.hits.concat(product.hits.hits);
      } else {
        const spec = await elasticService.client.search({
          index: type === 'store' ? 's_stores' : 's_product_storings',
          body: {
            query: {
              bool: type === 'store' ? param : storingQuery
            },
            from,
            size,
            ...(type === 'product' && !location
              ? {
                  collapse: {
                    field: 'product_id._id'
                  }
                }
              : {}),
            ...(group_store
              ? {
                  collapse: {
                    field: 'company_id._id'
                  }
                }
              : {})
            // ...(sort
            //   ? {
            //       sort: [
            //         {
            //           [type === 'store' ? storeSortQuery : productSortQuery]: {
            //             order: 'desc'
            //           }
            //         }
            //       ]
            //     }
            //   : {})
          }
        });
        data = spec.hits.hits;
      }
      return new BaseResponse({ statusCode: 200, data }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async autoComplete(req, res, next) {
    try {
      const { query, location } = req.query;
      const data = await searchService.autoComplete({ query, location });
      return new BaseResponse({ statusCode: 200, data }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async getCoordinates(req, res, next) {
    try {
      const { query } = req.query;
      const data = await searchService.getCoordinates(query);
      return new BaseResponse({ statusCode: 200, data }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async getAddress(req, res, next) {
    try {
      const { location } = req.query;
      const data = await searchService.getAddress(location);
      return new BaseResponse({ statusCode: 200, data }).return(res);
    } catch (error) {
      next(error);
    }
  },
  admin: {
    async getByName(req, res, next) {
      try {
        const { select = 'name', sort, limit, type, populate, company_id } = req.query;
        const name = removeAccents(handleXss(req.query.name || '')).toLowerCase();

        // Handle populate fields
        let populateFields = null;
        if (populate) {
          populateFields = populate
            .split(' ')
            .map((p) => ({ path: p, select: '_id name pure_name' }));
        }

        // Map model by type
        const model = searchConfig.SearchTypes[type];

        // Get & count results
        const query = { $text: { $search: name } };
        // For querying on a specific company
        if (company_id) {
          if (type === 'company') {
            query._id = company_id;
          }
          if (['product', 'store', 'promotion'].includes(type)) {
            query.company_id = company_id;
          }
        }
        const meta = { score: { $meta: 'textScore' } };
        const [results, total] = await Promise.all([
          model.find(query, meta, { select, sort, limit, populate: populateFields }).sort(meta),
          model.countDocuments(query)
        ]);

        const total_page = Math.ceil(total / limit);
        return new BaseResponse({
          statusCode: 200,
          data: results
        })
          .addMeta({ total, total_page })
          .return(res);
      } catch (err) {
        next(err);
      }
    }
  },
  company: {
    async getByName(req, res, next) {
      try {
        const { select = 'name', sort, limit, type, populate } = req.query;
        // const { id: company_id } = req.company;
        // Check permission
        const { id: userId } = req.user;
        const permission = await permissionGroupService.findOneActive({ user_id: userId });
        if (!permission) {
          throw new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: { permission: errorCode['permission.notAllow'] }
          });
        }
        const { company_id } = permission;

        const name = removeAccents(handleXss(req.query.name || '')).toLowerCase();

        // Map model by type
        const model = searchConfig.SearchTypes[type];

        // Handle populate fields
        let populateFields = null;
        if (populate) {
          populateFields = populate
            .split(' ')
            .map((p) => ({ path: p, select: '_id name pure_name' }));
        }

        // Get & count results
        const query = { $text: { $search: name } };
        if (['product', 'store', 'promotion'].includes(type)) {
          query.company_id = company_id;
        }
        const meta = { score: { $meta: 'textScore' } };
        const [results, total] = await Promise.all([
          model.find(query, meta, { select, sort, limit, populate: populateFields }).sort(meta),
          model.countDocuments(query)
        ]);

        const total_page = Math.ceil(total / limit);
        return new BaseResponse({
          statusCode: 200,
          data: results
        })
          .addMeta({ total, total_page })
          .return(res);
      } catch (err) {
        next(err);
      }
    }
  }
};
