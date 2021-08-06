import { Promise } from 'bluebird';
import mallStoringService from './mall-storing.service';
import { PopulatedFields, Statuses, DeletedStatus } from './mall-storing.config';
import { BaseResponse, errorCode, BaseError, selectToPopulate } from '../../../commons/utils';
import mallStoringModel from './mall-storing.model';

export default {
  async getById(req, res, next) {
    try {
      const { id: mallStoringId } = req.params;
      const { select, populate } = selectToPopulate(req.query.select, PopulatedFields);

      let mallStoring = await mallStoringService.findOneActive({ _id: mallStoringId }, select, {
        populate
      });
      if (mallStoring) {
        mallStoring = mallStoring.removeFields([
          'is_active_product',
          'is_active_mall',
          'transportable',
          'stock',
          'batch_stock',
          'sold',
          'active',
          'status'
        ]);
      }

      return new BaseResponse({ statusCode: 200, data: mallStoring }).return(res);
    } catch (err) {
      return next(err);
    }
  },
  async get(req, res, next) {
    try {
      const { limit, page, sort, select: selectStr, ...query } = req.query;
      query.status = Statuses.Active;
      const { select, populate } = selectToPopulate(selectStr, PopulatedFields);

      let [mallStorings, metadata] = await mallStoringService.findWithPagination({
        page,
        limit,
        select,
        sort,
        populate,
        query
      });
      if (mallStorings.length) {
        mallStorings = mallStorings.map((mallStoring) =>
          mallStoring.removeFields([
            'is_active_product',
            'is_active_mall',
            'transportable',
            'stock',
            'batch_stock',
            'sold',
            'active',
            'status'
          ])
        );
      }

      return new BaseResponse({ statusCode: 200, data: mallStorings })
        .addMeta(metadata)
        .return(res);
    } catch (err) {
      return next(err);
    }
  },
  mall: {
    async search(req, res, next) {
      try {
        const { query, limit = 10 } = req.query;
        const mall_id = req.mall_id;
        const data = await mallStoringModel.esSearch(
          {
            query: {
              bool: {
                must: [
                  {
                    match_phrase: { 'mall_id._id': mall_id }
                  },
                  {
                    match_phrase: { showable: true }
                  },
                  query
                    ? {
                        query_string: {
                          fields: ['product_id.name', 'product_id.pid'],
                          query
                          // analyzer: 'word_ngram'
                        }
                      }
                    : {
                        match_all: { boost: 1.2 }
                      }
                ]
              }
            }
          },
          {
            hydrate: {
              select: '-id',
              docsOnly: false,
              populate: [
                {
                  path: 'promotion',
                  match: {
                    start_at: {
                      $lte: new Date()
                    },
                    expire_at: {
                      $gt: new Date()
                    },
                    remain: {
                      $gt: 0
                    }
                  }
                },
                { path: 'product_id' }
              ]
            }
          }
        );
        return new BaseResponse({ statusCode: 200, data: data.hits.hits }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async getById(req, res, next) {
      try {
        const { mall_id: mallId } = req.mall;
        const { id: mallStoringId } = req.params;
        const { select, populate } = selectToPopulate(req.query.select, PopulatedFields);
        const mallStoring = await mallStoringService.findOne(
          { _id: mallStoringId, mall_id: mallId, status: { $ne: DeletedStatus } },
          select,
          {
            populate
          }
        );
        return new BaseResponse({ statusCode: 200, data: mallStoring }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async get(req, res, next) {
      try {
        const { mall_id: mallId } = req.mall;
        const { limit, page, sort, select: selectStr, ...query } = req.query;
        query.mall_id = mallId;
        query.status = { $ne: DeletedStatus };
        const { select, populate } = selectToPopulate(selectStr, PopulatedFields);

        const [mallStorings, metadata] = await mallStoringService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });

        return new BaseResponse({ statusCode: 200, data: mallStorings })
          .addMeta(metadata)
          .return(res);
      } catch (err) {
        return next(err);
      }
    },
    async updateStatus(req, res, next) {
      try {
        const { mall_id: mallId } = req.mall;
        const { mall_storings } = req.body;

        const updatedMallStorings = await Promise.map(
          mall_storings,
          async ({ id: mallStoringId, status }) => {
            const mallStoring = await mallStoringService.findOne({
              _id: mallStoringId,
              mall_id: mallId,
              status: { $ne: DeletedStatus }
            });
            if (!mallStoring) {
              throw new BaseError({
                statusCode: 404,
                error: errorCode.client,
                errors: {
                  mall_storing_id: errorCode['client.mallStoringNotFound']
                }
              });
            }

            mallStoring.status = status;

            return await mallStoring.save();
          }
        );

        return new BaseResponse({ statusCode: 200, data: updatedMallStorings }).return(res);
      } catch (err) {
        next(err);
      }
    },
    async update(req, res, next) {
      try {
        const { mall_id: mallId } = req.mall;
        const { id: mallStoringId } = req.params;
        const updates = req.body;
        const query = { _id: mallStoringId, mall_id: mallId, status: { $ne: DeletedStatus } };

        const updatedMallStoring = await mallStoringService.findOneAndUpdate(query, updates);
        if (!updatedMallStoring) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: {
              mall_storing_id: errorCode['client.mallStoringNotFound']
            }
          });
        }

        return new BaseResponse({ statusCode: 200, data: updatedMallStoring }).return(res);
      } catch (err) {
        return next(err);
      }
    }
  },
  admin: {
    async getById(req, res, next) {
      try {
        const { id: mallStoringId } = req.params;
        const { select, populate } = selectToPopulate(req.query.select, PopulatedFields);
        let mallStoring = await mallStoringService.findOne({ _id: mallStoringId }, select, {
          populate
        });

        return new BaseResponse({ statusCode: 200, data: mallStoring }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async get(req, res, next) {
      try {
        const { limit, page, sort, select: selectStr, ...query } = req.query;
        const { select, populate } = selectToPopulate(selectStr, PopulatedFields);

        let [mallStorings, metadata] = await mallStoringService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });

        return new BaseResponse({ statusCode: 200, data: mallStorings })
          .addMeta(metadata)
          .return(res);
      } catch (err) {
        return next(err);
      }
    }
  }
};
