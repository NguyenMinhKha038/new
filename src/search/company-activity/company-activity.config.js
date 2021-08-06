export const CompanyActionTypes = {
  create: 'create',
  update: 'update',
  delete: 'delete'
};

export const CompanyActionStatuses = {
  handling: 'handling',
  success: 'success',
  failed: 'failed'
};

export const CompanyActionModels = {
  s_company_banks: 's_company_banks',
  s_banner: 's_banner',
  s_category: 's_category',
  s_comment: 's_comment',
  s_company_reaction: 's_company_reaction',
  s_company: 's_company',
  s_deposit_withdraw: 's_deposit_withdraw',
  s_menu: 's_menu',
  s_order: 's_order',
  s_product: 's_product',
  s_product_stock_history: 's_product_stock_history',
  s_product_storing: 's_product_storing',
  s_promotion: 's_promotion',
  s_store: 's_store',
  s_setting: 's_setting',
  s_good_batch: 's_good_batch',
  s_warehouse: 's_warehouse',
  s_company_schedule: 's_company_schedule',
  s_stock_checking: 's_stock_checking',
  s_stock_checking_item: 's_stock_checking_item'
};

export const ActionMethods = {
  post: 'create',
  put: 'update',
  delete: 'delete',
  get: 'read'
};

export const CompanyActions = {
  updateCompanyInfo: {
    action: 'updateCompanyInfo',
    on_model: CompanyActionModels.s_company
  },
  updatePin: {
    action: 'updatePin',
    on_model: CompanyActionModels.s_company
  },
  resetPin: {
    action: 'resetPin',
    on_model: CompanyActionModels.s_company
  },
  setting: {
    action: 'setting',
    on_model: CompanyActionModels.s_setting
  },
  createStore: {
    action: 'createStore',
    on_model: CompanyActionModels.s_store
  },
  updateStore: {
    action: 'updateStore',
    on_model: CompanyActionModels.s_store
  },
  addProduct: {
    action: 'addProduct',
    on_model: CompanyActionModels.s_product
  },
  updateProductInfo: {
    action: 'updateProductInfo',
    on_model: CompanyActionModels.s_product
  },
  addProductToStore: {
    action: 'addProductToStore',
    on_model: CompanyActionModels.s_product_storing
  },
  updateProductStoring: {
    action: 'updateProductStoring',
    on_model: CompanyActionModels.s_product_storing
  },
  updateProductStoringStock: {
    action: 'updateProductStoringStock',
    on_model: CompanyActionModels.s_product_stock_history
  },
  requestMoveProductStoringStock: {
    action: 'requestMoveProductStoringStock',
    on_model: CompanyActionModels.s_product_stock_history
  },
  approveMoveProductStoringStock: {
    action: 'approveMoveProductStoringStock',
    on_model: CompanyActionModels.s_product_stock_history
  },
  confirmMoveProductStoringStock: {
    action: 'confirmMoveProductStoringStock',
    on_model: CompanyActionModels.s_product_stock_history
  },
  updateProductStock: {
    action: 'updateProductStock',
    on_model: CompanyActionModels.s_product_stock_history
  },
  requestMoveProductStock: {
    action: 'requestMoveProductStock',
    on_model: CompanyActionModels.s_product_stock_history
  },
  confirmMoveProductStock: {
    action: 'confirmMoveProductStock',
    on_model: CompanyActionModels.s_product_stock_history
  },
  approveMoveProductStock: {
    action: 'approveMoveProductStock',
    on_model: CompanyActionModels.s_product_stock_history
  },
  createPromotion: {
    action: 'createPromotion',
    on_model: CompanyActionModels.s_promotion
  },
  disablePromotion: {
    action: 'disablePromotion',
    on_model: CompanyActionModels.s_promotion
  },
  updatePromotion: {
    action: 'updatePromotion',
    on_model: CompanyActionModels.s_promotion
  },
  createMenu: {
    action: 'createMenu',
    on_model: CompanyActionModels.s_menu
  },
  updateMenu: {
    action: 'updateMenu',
    on_model: CompanyActionModels.s_menu
  },
  deleteMenu: {
    action: 'deleteMenu',
    on_model: CompanyActionModels.s_menu
  },
  addBank: {
    action: 'addBank',
    on_model: CompanyActionModels.s_company_banks
  },
  updateBankInfo: {
    action: 'updateBankInfo',
    on_model: CompanyActionModels.s_company_banks
  },
  deposit: {
    action: 'deposit',
    on_model: CompanyActionModels.s_deposit_withdraw
  },
  withdraw: {
    action: 'withdraw',
    on_model: CompanyActionModels.s_deposit_withdraw
  },
  createCategory: {
    action: 'createCategory',
    on_model: CompanyActionModels.s_category
  },
  confirmOrder: {
    action: 'confirmOrder',
    on_model: CompanyActionModels.s_order
  },
  updateOrder: {
    action: 'updateOrder',
    on_model: CompanyActionModels.s_order
  },
  payOrder: {
    action: 'payOrder',
    on_model: CompanyActionModels.s_order
  },
  createOrder: {
    action: 'createOrder',
    on_model: CompanyActionModels.s_order
  },
  createBanner: {
    action: 'createBanner',
    on_model: CompanyActionModels.banner
  },
  updateBanner: {
    action: 'updateBanner',
    on_model: CompanyActionModels.banner
  },
  createGoodsBatch: {
    action: 'createGoodsBatch',
    on_model: CompanyActionModels.s_goods_batch
  },
  updateGoodsBatch: {
    action: 'updateGoodsBatch',
    on_model: CompanyActionModels.s_goods_batch
  },
  deleteGoodsBatch: {
    action: 'deleteGoodsBatch',
    on_model: CompanyActionModels.s_goods_batch
  },
  createWarehouse: {
    action: 'createWarehouse',
    on_model: CompanyActionModels.s_warehouse
  },
  updateWarehouse: {
    action: 'updateWarehouse',
    on_model: CompanyActionModels.s_warehouse
  },
  deleteWarehouse: {
    action: 'deleteWarehouse',
    on_model: CompanyActionModels.s_warehouse
  },
  createSchedule: {
    action: 'createSchedule',
    on_model: CompanyActionModels.s_company_schedule
  },
  updateSchedule: {
    action: 'updateSchedule',
    on_model: CompanyActionModels.s_company_schedule
  },
  createStockChecking: {
    action: 'createStockChecking',
    on_model: CompanyActionModels.s_stock_checking
  },
  updateStockChecking: {
    action: 'updateStockChecking',
    on_model: CompanyActionModels.s_stock_checking
  },
  createStockCheckingItem: {
    action: 'createStockCheckingItem',
    on_model: CompanyActionModels.s_stock_checking_item
  },
  updateStockCheckingItem: {
    action: 'updateStockCheckingItem',
    on_model: CompanyActionModels.s_stock_checking_item
  }
};

export default {
  ActionTypes: CompanyActionTypes,
  DefaultLimit: 50,
  OnModels: CompanyActionModels,
  ActionStatus: CompanyActionStatuses
};
