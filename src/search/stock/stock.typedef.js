/**
 * @typedef {'request' | 'approve' | 'confirm' | 'update'} Permission
 */

/**
 * @typedef {'store' | 'stock'} RequesterType
 */

/**
 * @typedef {'store_to_stock' | 'stock_to_store'} MovingType
 */

/**
 * @typedef {'company_stock' | 'store_stock'} StaffType
 */

/**
 * @typedef {'pending' | 'cancelled' | 'completed' | 'approved'} Status
 */

/**
 * @typedef {'import' | 'export'} UpdateType
 */

/**
 * @typedef MovedProduct
 * @property {string} id
 * @property {number} stock Only used for confirming the move request
 * @property {'approved'|'cancelled'|'completed'} status `approved` - used for approving, `completed` - used for confirming the move request
 */

/**
 * @typedef {'approved'|'cancelled'} ApprovedStatus
 */

/**
 * @typedef {'completed'|'cancelled'} ConfirmedStatus
 */
