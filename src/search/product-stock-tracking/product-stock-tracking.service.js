import { pick } from 'lodash';
import extendService from '../../commons/utils/extend-service';
import warehouseStoringService from '../warehouse-storing/warehouse-storing.service';
import productStoringServiceV2 from '../product-storing/v2/product-storing.service';
import productStoringHandlerV2 from '../product-storing/v2/product-storing.handler';
import mallStoringService from '../sum-mall/mall-storing/mall-storing.service';
import productStockTrackingModel from './product-stock-tracking.model';
import { BaseError } from '../../commons/utils';
import { Types as TrackingTypes } from './product-stock-tracking.config';
import warehouseStoringHandler from '../warehouse-storing/warehouse-storing.handler';
import mallStoringHandler from '../sum-mall/mall-storing/mall-storing.handler';

const StoringDict = {
  store: { service: productStoringServiceV2, handler: productStoringHandlerV2 },
  warehouse: { service: warehouseStoringService, handler: warehouseStoringHandler },
  mall: { service: mallStoringService, handler: mallStoringHandler }
};

export default {
  ...extendService(productStockTrackingModel),
  /**
   * @param {{
   *  trackingPlace: string
   *  prevStoringDoc: object
   *  curStoringDoc: object
   *  type: string
   *  batch_id: string
   * }} { trackingPlace, prevStoringDoc, curStoringDoc, type, batch_id }
   * @param {*} options
   * @returns {Promise<object>} tracking document
   */
  async create({ trackingPlace, prevStoringDoc, curStoringDoc, type, batch_id }, options = {}) {
    const { session } = options;
    const { service: storingService } = StoringDict[trackingPlace];

    let prevStoring = prevStoringDoc;
    let curStoring = curStoringDoc;

    // Check if missing prevStoringDoc & type
    if (
      (!prevStoring && type !== TrackingTypes.Import) ||
      (!prevStoringDoc && !curStoringDoc) ||
      !Object.values(TrackingTypes).includes(type)
    ) {
      throw new BaseError({ statusCode: 500, message: 'missing required args' });
    }

    let storingId = null;
    if (prevStoring) {
      prevStoring = prevStoring.toObject ? prevStoring.toObject() : prevStoring;
      storingId = prevStoring._id || prevStoring.id;
    } else {
      storingId = curStoring._id || curStoring.id;
    }

    // Fetch current storing doc if missing curStoringDoc
    if (!curStoringDoc && storingId) {
      const storingDoc = await storingService.findOneActive({ _id: storingId }, null, {
        session
      });
      if (!storingDoc) {
        throw new BaseError({ statusCode: 500, message: 'storing doc not found' });
      }

      curStoring = storingDoc.toObject();
    } else {
      curStoring = curStoringDoc.toObject ? curStoringDoc.toObject() : curStoringDoc;
    }

    // Create tracking doc
    const { _id, id, createdAt, updatedAt, ...dataToCreate } = {
      [`${trackingPlace}_storing_id`]: storingId,
      ...curStoring,
      prev: prevStoring,
      type,
      batch_id
    };

    const productStockTracking = await new productStockTrackingModel(dataToCreate).save({
      session
    });
    return productStockTracking;
  }
};
