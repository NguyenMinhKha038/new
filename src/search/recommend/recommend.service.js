import productService from '../product/product.service';
import { DefaultLimit, MaxLimit, DefaultPriceRange } from './recommend.config';
import { logger } from '../../commons/utils';
import behaviorService from '../behavior/behavior.service';
import {
  PositiveBehaviors,
  NegativeBehaviors,
  GeneralBehaviors
} from '../behavior/behavior.config';

export default {
  async getRecommendedProductsByProduct(product, options = {}) {
    try {
      const {
        id: product_id,
        price,
        type_category_id,
        company_category_id,
        sub_category_id
      } = product;
      // Check if product_id not exist
      if (!product_id) {
        throw new Error('product_id is empty');
      }

      let _product = product;
      // If fields price, type_category_id, company_category_id, sub_category_id empty, fetch them with product_id
      if (
        (!price && price !== 0) ||
        (!type_category_id && !company_category_id && !sub_category_id)
      ) {
        _product = await productService.findOne({ _id: product_id });
      }
      if (!_product) {
        throw new Error('product not exist');
      }

      // Get products
      const { limit = DefaultLimit, sort, select } = options;
      const orQuery = [];
      ['type_category_id', 'company_category_id', 'sub_category_id'].forEach((key) => {
        _product[key] && orQuery.push({ [key]: _product[key] });
      });
      const query = {
        _id: { $ne: product_id },
        price: {
          $gte: _product.price - DefaultPriceRange.min,
          $lte: _product.price + DefaultPriceRange.max
        },
        $or: orQuery
      };
      const products = await productService.find({
        ...query,
        sort,
        select,
        limit: Math.min(limit, MaxLimit)
      });

      return { error: false, data: products };
    } catch (err) {
      logger.error('get recommend product by product error: %o', err);
      return { error: err, data: null };
    }
  },
  async getRecommendedProductsByUser(user, options = {}) {
    try {
      const { limit = DefaultLimit, select, sort } = options;
      const user_id = user._id || user.id;
      // Get type_category_id, company_category_id, sub_category_id of product that user bought,viewed,liked,shared
      const behaviorQuery = {
        user_id,
        type: {
          $in: [...GeneralBehaviors.Reaction.Product, ...PositiveBehaviors.Reaction.Product],
          $nin: [...NegativeBehaviors.Reaction.Product]
        }
      };
      const results = await behaviorService.find({
        ...behaviorQuery,
        sort: '-createdAt',
        limit: 50,
        select: 'type_category_id company_category_id sub_category_id'
      });

      // Get lists of [type, company, sub]_category_id in order to get recommended products
      const { typeCateIds, compCateIds, subCateIds } =
        results && results.length
          ? {
              typeCateIds: results.map((re) => re.type_category_id),
              compCateIds: results.map((re) => re.company_category_id),
              subCateIds: results.map((re) => re.sub_category_id)
            }
          : { typeCateIds: [], compCateIds: [], subCateIds: [] };

      // Get recommended products
      const query = {
        $or: [
          { sub_category_id: { $in: subCateIds.filter((s) => !!s) } },
          { company_category_id: { $in: compCateIds.filter((c) => !!c) } },
          { type_category_id: { $in: typeCateIds.filter((t) => !!t) } }
        ]
      };
      const products = await productService.find({
        limit: Math.min(limit, MaxLimit),
        sort,
        select,
        ...query
      });

      return { error: false, data: products };
    } catch (err) {
      return { error: err, data: null };
    }
  }
};
