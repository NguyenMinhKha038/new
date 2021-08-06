import { Promise } from 'bluebird';
import warehouseStoringService from './warehouse-storing.service';
import { PopulatedFields, Statuses, DeletedStatus } from './warehouse-storing.config';
import { BaseResponse, errorCode, BaseError, selectToPopulate } from '../../commons/utils';

export default {
  async getById(req, res, next) {
    try {
      const { id: warehouseStoringId } = req.params;
      const { select, populate: populatedStr } = req.query;
      const { populate } = selectToPopulate(populatedStr, PopulatedFields);
      let warehouseStoring = await warehouseStoringService.findOneActive(
        { _id: warehouseStoringId },
        select,
        {
          populate
        }
      );
      if (warehouseStoring) {
        warehouseStoring = warehouseStoring.removeFields([
          'is_active_product',
          'is_active_warehouse',
          'is_active_company',
          'transportable',
          'sold',
          'stock',
          'batch_stock',
          'active',
          'status'
        ]);
      }

      return new BaseResponse({ statusCode: 200, data: warehouseStoring }).return(res);
    } catch (err) {
      return next(err);
    }
  },
  async get(req, res, next) {
    try {
      const { limit, page, sort, select, populate: populatedStr, ...query } = req.query;
      query.status = Statuses.Active;
      const { populate } = selectToPopulate(populatedStr, PopulatedFields);

      let [warehouseStorings, metadata] = await warehouseStoringService.findWithPagination({
        page,
        limit,
        select,
        sort,
        populate,
        query
      });
      if (warehouseStorings.length) {
        warehouseStorings = warehouseStorings.map((warehouseStoring) =>
          warehouseStoring.removeFields([
            'is_active_product',
            'is_active_warehouse',
            'is_active_company',
            'transportable',
            'sold',
            'stock',
            'batch_stock',
            'active',
            'status'
          ])
        );
      }

      return new BaseResponse({ statusCode: 200, data: warehouseStorings })
        .addMeta(metadata)
        .return(res);
    } catch (err) {
      return next(err);
    }
  },
  company: {
    async getById(req, res, next) {
      try {
        const { id: company_id } = req.company;
        const { id: warehouseStoringId } = req.params;
        const { select, populate: populatedStr } = req.query;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);
        const warehouseStoring = await warehouseStoringService.findOne(
          { _id: warehouseStoringId, company_id, status: { $ne: DeletedStatus } },
          select,
          {
            populate
          }
        );
        return new BaseResponse({ statusCode: 200, data: warehouseStoring }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async get(req, res, next) {
      try {
        const { id: companyId } = req.company;
        const { limit, page, sort, select, populate: populatedStr, ...query } = req.query;
        query.company_id = companyId;
        query['$and'] = [{ status: { $ne: DeletedStatus } }];
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        const [warehouseStorings, metadata] = await warehouseStoringService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });

        return new BaseResponse({ statusCode: 200, data: warehouseStorings })
          .addMeta(metadata)
          .return(res);
      } catch (err) {
        return next(err);
      }
    },
    async updateStatus(req, res, next) {
      try {
        const { id: company_id, is_owner, warehouse_id } = req.company;
        const { warehouse_storings } = req.body;

        const updatedWarehouseStorings = await Promise.map(
          warehouse_storings,
          async ({ id: warehouseStoringId, status }) => {
            const query = {
              status: { $ne: DeletedStatus },
              _id: warehouseStoringId,
              company_id
            };
            if (!is_owner) {
              query.warehouse_id = warehouse_id;
            }
            const warehouseStoring = await warehouseStoringService.findOne(query);
            if (!warehouseStoring) {
              throw new BaseError({
                statusCode: 404,
                error: errorCode.client,
                errors: {
                  warehouse_storing_id: errorCode['client.warehouseStoringNotFound']
                }
              });
            }

            warehouseStoring.status = status;

            return await warehouseStoring.save();
          }
        );

        return new BaseResponse({ statusCode: 200, data: updatedWarehouseStorings }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async update(req, res, next) {
      try {
        const { id: company_id, warehouse_id, is_owner } = req.company;
        const { id: warehouseStoringId } = req.params;
        const { nothing, ...updates } = req.body;
        const query = {
          _id: warehouseStoringId,
          company_id,
          status: { $ne: DeletedStatus }
        };
        if (!is_owner) {
          query.warehouse_id = warehouse_id;
        }

        const updatedWarehouseStoring = await warehouseStoringService.findOneAndUpdate(
          query,
          updates
        );
        if (!updatedWarehouseStoring) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: {
              warehouse_storing_id: errorCode['client.warehouseStoringNotFound']
            }
          });
        }

        return new BaseResponse({ statusCode: 200, data: updatedWarehouseStoring }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async delete(req, res, next) {
      try {
        const { id: company_id, is_owner, warehouse_id } = req.company;
        const { id: warehouseStoringId } = req.params;

        const query = {
          _id: warehouseStoringId,
          company_id,
          status: { $ne: DeletedStatus }
        };
        if (!is_owner) {
          query.warehouse_id = warehouse_id;
        }

        const deletedWarehouseStoring = await warehouseStoringService.findOneAndUpdate(query, {
          status: DeletedStatus
        });
        if (!warehouseStoring) {
          throw new BaseError({
            statusCode: 404,
            error: errorCode.client,
            errors: {
              warehouse_storing_id: errorCode['client.warehouseStoringNotFound']
            }
          });
        }

        return new BaseResponse({ statusCode: 200, data: deletedWarehouseStoring }).return(res);
      } catch (err) {
        return next(err);
      }
    }
  },
  admin: {
    async getById(req, res, next) {
      try {
        const { id: warehouseStoringId } = req.params;
        const { select, populate: populatedStr } = req.query;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);
        let warehouseStoring = await warehouseStoringService.findOne(
          { _id: warehouseStoringId },
          select,
          {
            populate
          }
        );

        return new BaseResponse({ statusCode: 200, data: warehouseStoring }).return(res);
      } catch (err) {
        return next(err);
      }
    },
    async get(req, res, next) {
      try {
        const { limit, page, sort, select, populate: populatedStr, ...query } = req.query;
        const { populate } = selectToPopulate(populatedStr, PopulatedFields);

        let [warehouseStorings, metadata] = await warehouseStoringService.findWithPagination({
          page,
          limit,
          select,
          sort,
          populate,
          query
        });

        return new BaseResponse({ statusCode: 200, data: warehouseStorings })
          .addMeta(metadata)
          .return(res);
      } catch (err) {
        return next(err);
      }
    }
  }
};
