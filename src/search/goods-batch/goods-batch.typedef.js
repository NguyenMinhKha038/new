/**
 * @typedef {'warehouse'|'store'|'mall'} PlaceOfStock
 */

/**
 * @typedef {'import'|'export'|'update'} Permission
 */

/**
 * @typedef {'get'|'request'|'update'|'approve'|'confirm'} MovePermission
 */

/**
 * @typedef { 
  'warehouse_to_warehouse'|
  'warehouse_to_store'|
  'warehouse_to_mall'|
  'store_to_store'|
  'store_to_warehouse'|
  'store_to_mall'|
  'mall_to_mall'|
  'mall_to_warehouse'|
  'mall_to_store|
  } MovingType
 */

/**
 * @typedef { 'from'|'to' } RequesterType
 */

/**
 * @typedef {{ id: string, stock: number }} Batch
 */

/**
 * @typedef GoodsBatchDataToCreate
 * @property {string} created_by_id
 * @property {string} company_id
 * @property {string} product_id
 * @property {Date} import_date
 * @property {Date} export_date
 * @property {Date} manufacturing_date
 * @property {Date} expiry_date
 * @property {string} origin
 * @property {string} stock_keeping_unit
 * @property {number} stock
 * @property {PlaceOfStock} place_of_stock
 * @property {string} store_id
 * @property {string} provider_id
 */

/**
 * @typedef User
 * @property {string} _id
 * @property {string} id
 * @property {string} user_id
 * @property {string} store_id
 * @property {string[]} type
 * @property {boolean} is_company
 * @property {boolean} is_mall
 * @property {boolean} is_owner
 * @property {boolean} is_manager
 */
