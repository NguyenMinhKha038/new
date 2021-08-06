import behaviorModel from './behavior.model';
import { DefaultLimit } from './behavior.config';
import { searchService } from '../search/search.service';
import addressService from '../address/address.service';
import { findAdvanced, logger } from '../../commons/utils';
import productService from '../product/product.service';

const behaviorService = {
  async aggregate(stages) {
    return behaviorModel.aggregate(stages);
  },
  async find({ limit = DefaultLimit, page, select, sort, ...query }) {
    try {
      const behaviors = await findAdvanced(behaviorModel, {
        query,
        limit,
        page,
        select,
        sort
      });
      return behaviors;
    } catch (error) {
      throw error;
    }
  },
  async findOne(query, select, options) {
    return await behaviorModel.findOne(query, select, options);
  },
  async count(query) {
    return await behaviorModel.countDocuments(query);
  },
  async findAndCount({ limit, select, sort, page = 1, ...query }) {
    const [behaviors, count] = await Promise.all([
      this.find({ limit, page, select, sort, ...query }),
      this.count(query)
    ]);

    return { behaviors, count };
  },
  async createShoppingBehavior({
    user_id,
    type,
    type_category_id,
    company_category_id,
    sub_category_id,
    company_id,
    store_id,
    product_id,
    order_id,
    canceled_by,
    reason_canceled,
    reason_rejected,
    address_id,
    latitude, // When get lat of user's location.
    longitude, // When get lon of user's location.
    address, // When only get text address of user.
    location: _location
  }) {
    try {
      let location = null;
      if (_location) {
        location = { ..._location };
      } else if (address_id) {
        // Fetch location info from col s_address if address_id exists
        let locationInfo = await addressService.findOne({ _id: address_id });
        if (locationInfo) {
          locationInfo = locationInfo.toObject();
          const { location: loc, ...rest } = locationInfo;
          location = {
            ...rest
          };
          if (loc && loc.type === 'Point') {
            location.latitude = loc.coordinates[1];
            location.longitude = loc.coordinates[0];
          }
        }
        // Geocoding if lat & lon exist
      } else if (latitude && longitude) {
        const { data } = await searchService.getAddressDetails('Point', {
          latitude,
          longitude
        });
        location = data;
        // Reversing if address exist
      } else if (address) {
        const { data } = await searchService.getAddressDetails('Address', { address });
        location = { ...data, raw_address: address };
      }

      // logger.info('location: %o', location);
      // Map [type,company,sub]_category_id if not yet
      let product = {};
      if (product_id && !type_category_id && !company_category_id && !sub_category_id) {
        product = await productService.findOne({ _id: product_id });
      }
      const newBehavior = new behaviorModel({
        user_id,
        type,
        type_category_id: product.type_category_id || type_category_id,
        company_category_id: product.company_category_id || company_category_id,
        sub_category_id: product.sub_category_id || sub_category_id,
        company_id,
        store_id,
        product_id,
        order_id,
        canceled_by,
        reason_canceled,
        reason_rejected,
        location
      });

      const behavior = await newBehavior.save();
      return { error: false, data: behavior };
    } catch (err) {
      logger.error('Create shopping behavior error: %o', err);
      return { error: true, data: null }; // Return this to avoid affection to other process
    }
  },
  async createMultiShoppingBehavior(data_arr) {
    return await Promise.all(data_arr.map((data) => this.createShoppingBehavior(data)));
  },
  async createReactionBehavior({
    user_id,
    type,
    reaction_id,
    company_id,
    type_category_id,
    company_category_id,
    sub_category_id,
    store_id,
    product_id,
    on_model,
    address_id,
    latitude,
    longitude,
    address,
    location: _location
  }) {
    try {
      let location = null;
      if (_location) {
        location = {
          ..._location
        };
      } else if (address_id) {
        // Fetch location info from col s_address if address_id exists
        let locationInfo = await addressService.findOne({ _id: address_id });
        if (locationInfo) {
          locationInfo = locationInfo.toObject();
          const { location: loc, ...rest } = locationInfo;
          location = {
            ...rest
          };
          if (loc && loc.type === 'Point') {
            location.latitude = loc.coordinates[1];
            location.longitude = loc.coordinates[0];
          }
        }
        // Geocoding if lat & lon exist
      } else if (latitude && longitude) {
        const { data } = await searchService.getAddressDetails('Point', {
          latitude,
          longitude
        });
        location = data;
        // Reversing if address exist
      } else if (address) {
        const { data } = await searchService.getAddressDetails('Address', { address });
        location = { ...data, raw_address: address };
      }

      // logger.info('location: %o', location);
      // Map [type,company,sub]_category_id if not yet
      let product = {};
      if (product_id && !type_category_id && !company_category_id && !sub_category_id) {
        product = await productService.findOne({ _id: product_id });
      }
      const newBehavior = new behaviorModel({
        user_id,
        type,
        reaction_id,
        company_id,
        store_id,
        product_id,
        type_category_id: product.type_category_id || type_category_id,
        company_category_id: product.company_category_id || company_category_id,
        sub_category_id: product.sub_category_id || sub_category_id,
        on_model,
        location
      });

      const behavior = await newBehavior.save();
      return { error: false, data: behavior };
    } catch (err) {
      logger.error('Create reaction behavior error: %o', err);
      return { error: true, data: null };
    }
  }
};

export default behaviorService;
