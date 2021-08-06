export const mallActionsModels = {
  s_mall: 's_mall',
  s_mall_staff: 's_mall_staff',
  s_work_schedule: 's_work_schedule',
  s_staff_check_in: 's_staff_check_in',
  s_goods_batch: 's_goods_batch'
};

export { mallActionsModels as MallActionModels };

export const mallActions = {
  updateInfo: {
    action: 'updateInfo',
    on_model: mallActionsModels.s_mall
  },
  createStaff: {
    action: 'createStaff',
    on_model: mallActionsModels.s_mall_staff
  },
  updateStaff: {
    action: 'updateStaff',
    on_model: mallActionsModels.s_mall_staff
  },
  createSchedule: {
    action: 'createSchedule',
    on_model: mallActionsModels.s_work_schedule
  },
  updateSchedule: {
    action: 'updateSchedule',
    on_model: mallActionsModels.s_work_schedule
  },
  checkInForStaff: {
    action: 'checkInForStaff',
    on_model: mallActionsModels.s_staff_check_in
  },
  checkOutForStaff: {
    action: 'checkOutForStaff',
    on_model: mallActionsModels.s_staff_check_in
  },
  createGoodsBatch: {
    action: 'createGoodsBatch',
    on_model: mallActionsModels.s_goods_batch
  },
  updateGoodsBatch: {
    action: 'updateGoodsBatch',
    on_model: mallActionsModels.s_goods_batch
  },
  deleteGoodsBatch: {
    action: 'deleteGoodsBatch',
    on_model: mallActionsModels.s_goods_batch
  }
};

export { mallActions as MallActions };
