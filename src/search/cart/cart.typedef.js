/**
 * @typedef {object} SProduct
 * @property {string} _id product_storing_id
 * @property {string} id product_id
 * @property {string} company_id
 * @property {string} store_id
 * @property {number} quantity
 * @property {number} price
 * @property {string} name
 * @property {number} final_price
 * @property {number} original_price
 * @property {number} original_total
 * @property {number} total
 * @property {number} refund_rate
 * @property {number} discount_rate
 * @property {number} refund
 * @property {number} total_refund
 * @property {number} discount
 * @property {number} total_discount
 * @property {boolean} is_limited_stock
 * @property {boolean} is_free_transport
 */

/**
 * @typedef {object} SCartOrder
 * @property {string} store_id
 * @property {object} store_address
 * @property {string} company_id
 * @property {SProduct[]} products
 * @property {string} promotion_code
 * @property {string} promotion_id
 * @property {string} is_valid_promotion_code
 * @property {string} promotion
 * @property {string} original_total
 * @property {string} total
 * @property {string} total_refund
 * @property {string} total_discount
 * @property {string} transport_fee
 * @property {string} is_discount_transport
 * @property {string} calculated_transport_fee
 * @property {string} distance
 * @property {string} logistics_provider
 * @property {string} logistics_info
 * @property {[]} logistics_available
 * @property {boolean} is_received_at_store
 * @property {boolean} expected_received_date
 * @property {boolean} note
 */

/**
 * @typedef {object} SCart
 * @property {string }code
 * @property {string} user_id
 * @property {SCartOrder[]} orders
 * @property {boolean} is_confirmed
 * @property {boolean} is_checkouted
 * @property {boolean} is_paid
 * @property {number} total
 * @property {number} original_total
 * @property {number} total_discount
 * @property {number} total_refund
 * @property {number} total_transport_fee
 * @property {string} receipt_code
 * @property {'COD'| 'WALLET'|'VNPAY'} payment_method
 * @property {{ address_id: string,
 *  province: string,
 *  district: string,
 *  ward: string,
 *  text: string,
 *  receiver: string,
 *  phone_number: string,
 *  normalizedAddress: string}} delivery_address
 * @property {boolean} is_lucky
 * @property {Date} checkouted_date
 */
