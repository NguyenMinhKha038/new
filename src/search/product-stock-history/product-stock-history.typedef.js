/**
 * @typedef {{ request_note: string, approve_note: string, confirm_note: string }} Notes
 */

/**
 * @typedef {{
 *  is_active_product: bolean,
 *  transportable: boolean,
 *  stock: number,
 *  is_active_store: boolean,
 *  is_active_company: boolean,
 *  is_limited_stock: boolean
 * }} StoringSnapshot
 */

/**
 * @typedef {'move'|'import'|'export'|'sell'|'refund'} HistoryType
 */

/**
 * @typedef {'store_to_store'|'store_to_stock'|'stock_to_store'} HistoryMovingType
 */

/**
 * @typedef TransferredProduct
 * @property {'pending'|'cancelled'|'approved'|'completed'} status
 * @property {string} from_product_storing_id
 * @property {string} to_product_storing_id
 * @property {string} product_id
 * @property {StoringSnapshot} from_storing_snapshot
 * @property {StoringSnapshot} to_storing_snapshot
 */

/**
 * @typedef StockHistory
 * @property {Notes} notes
 * @property {string} note
 * @property {boolean} performed_by_owner
 * @property {'pending'|'cancelled'|'approved'|'completed'} status
 * @property {boolean} need_approved
 * @property {'store'|'stock'} requester_type
 * @property {string} company_id
 * @property {string} from_store_id
 * @property {string} to_store_id
 * @property {string} from_product_storing_id
 * @property {string} to_product_storing_id
 * @property {string} product_id
 * @property {number} request_move_quantity
 * @property {number} from_delta_quantity
 * @property {StoringSnapshot} from_storing_snapshot
 * @property {StoringSnapshot} to_storing_snapshot
 * @property {string} performed_by_id
 * @property {string} performed_store_id
 * @property {HistoryType} type
 * @property {HistoryMovingType} moving_type
 * @property {'store'|'stock'} relate_to
 * @property {TransferredProduct[]} products
 */
