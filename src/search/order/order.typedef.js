/**
 * @typedef {object} SOrder
 * @property {{}} products
 * @property {string} cart_id
 * @property {string} store_id
 * @property {string} company_id
 * @property {string} user_id
 * @property {string} seller_id
 * @property {string} cashier_id
 * @property {string} user_name
 * @property {number} original_total
 * @property {number} total
 * @property {number} transport_fee
 * @property {number} calculated_transport_fee
 * @property {number} actual_transport_fee
 * @property {number} company_transport_fee
 * @property {number} return_transport_fee
 * @property {number} additional_transport_fee
 * @property {boolean} is_discount_transport
 * @property {string} waybill_code
 * @property {Date} expected_delivery_time
 * @property {number} discount_rate
 * @property {number} total_discount
 * @property {number} refund_rate
 * @property {number} total_refund
 * @property {string} code
 * @property {'online'| 'offline'} type
 * @property {boolean} without_product
 * @property {'COD'| 'WALLET'| 'CASH'| 'VNPAY'} payment_method
 * @property {SUserAddress} delivery_address
 * @property {SStoreAddress} store_address
 * @property {SOrderStatus} status
 * @property {SOrderNumber} status_number
 * @property {string} promotion_code
 * @property {string} promotion_id
 * @property {boolean} is_paid
 * @property {boolean} is_confirmed
 * @property {number} total_service_fee
 * @property {string} reason_canceled
 * @property {string} reason_rejected
 * @property {string} logistics_provider
 * @property {{}} logistics_info
 * @property {[]} logistics_progress
 * @property {boolean} is_company_paid_transport_fee
 * @property {boolean} is_company_paid_return_fee
 * @property {SOrderProcessingStatus} progress_status
 * @property {boolean} is_created_from_menu
 * @property {boolean} position eg: table number, seats...
 * @property {boolean} is_received_by_user
 * @property {Date} delivered_date
 * */

/**
 * @typedef {{province: string
              district: string
              ward: string
              text: string
              receiver: string
              phone_number: string
              normalizedAddress: string}} SUserAddress
 */

/**
 * @typedef {{province: string
              district: string
              ward: string
              text: string
              manager_name: string
              phone_number: string
              normalizedAddress: string}} SStoreAddress
 */

/**  
  * @typedef {'completed'|
              'user_canceled'|
              'company_canceled'|
              'handling'|
              'picking'|
              'delivering'|
              'delivered'|
              'user_rejected'
            } SOrderStatus
 */

/**
 * @typedef {'pending'| 'handling'| 'ready'} SOrderProcessingStatus
 */
