import { BaseError, errorCode, findAdvanced, mergeObject } from '../../commons/utils';
import cartModel from './cart.model';

export default {
  async find({ limit, page, select, sort, ...query }) {
    const carts = await findAdvanced(cartModel, {
      query,
      limit,
      page,
      select,
      sort
    });
    return carts;
  },
  async findActiveCart({ user_id, condition, populate = '' }) {
    const cart = await cartModel
      .findOneAndUpdate(
        mergeObject({ user_id, is_confirmed: false }, condition),
        {},
        {
          upsert: true,
          runValidators: true,
          new: true,
          setDefaultsOnInsert: true
        }
      )
      .populate(populate);
    if (!cart)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { cart: errorCode['client.cartIsEmpty'] }
      });
    return cart;
  },

  /**
   *
   * @param {string} query
   * @param {{}} options
   * @returns {Promise<SCart>} cart
   */
  async findOne(query, options) {
    return cartModel.findOne(query, null, options);
  },
  generate(doc) {
    return new cartModel(doc);
  },
  async count(query) {
    return cartModel.countDocuments(mergeObject({}, query));
  },
  async update(query, update, { populate, session } = {}) {
    return cartModel
      .findOneAndUpdate(query, update, {
        runValidators: true,
        new: true,
        setDefaultsOnInsert: true
      })
      .session(session)
      .populate(populate);
  }
};

export const populateOptions = {
  storing_detail: {
    path: 'orders.products.storing_detail',
    select:
      'name price stock refund_rate refund thumbnail price packaging_weight packaging_length packaging_width packaging_height transportable is_free_transport is_limited_stock'
  },
  detail: {
    path: 'orders.products.detail',
    select:
      'name stock refund_rate refund thumbnail price packaging_weight packaging_length packaging_width packaging_height transportable is_free_transport is_limited_stock'
  },
  storing: {
    path: 'orders.products.storing',
    select: 'stock sold is_active_product active is_active_store is_active_company'
  },
  storings: {
    path: 'orders.products.storings',
    select: 'stock'
  },
  company: {
    path: 'orders.company'
  }
};
