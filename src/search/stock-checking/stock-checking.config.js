export const Statuses = {
  Pending: 'pending',
  Handling: 'handling',
  Completed: 'completed',
  Disabled: 'disabled'
};

export const AllowedStatusUpdate = {
  pending: {
    pending: 0,
    handling: 1,
    completed: 0,
    disabled: 1
  },
  handling: {
    pending: 0,
    handling: 0,
    completed: 1,
    disabled: 1
  },
  completed: {
    pending: 0,
    handling: 0,
    completed: 0,
    disabled: 1
  }
};

export const CheckingPlaces = {
  Warehouse: 'warehouse',
  Store: 'store',
  Mall: 'mall'
};

export const CheckingTypes = {
  All: 'all',
  Category: 'category',
  Custom: 'custom'
};

export const AllowedStaffRole = {
  Owner: 'owner',
  CompanyStock: 'company_stock',
  StoreStock: 'store_stock',
  StoreManager: 'store_manager',
  WarehouseManager: 'warehouse_manager',
  WarehouseStock: 'warehouse_stock',
  MallStock: 'mall_stock',
  MallManager: 'mall_manager'
};

export const PopulatedFields = [
  {
    path: 'staff',
    select: 'addresses phone name pure_name status'
  },
  {
    path: 'company',
    select: 'name representer cover_image logo phone_number email address is_company'
  },
  {
    path: 'store'
  },
  {
    path: 'warehouse'
  },
  {
    path: 'mall'
  },
  {
    path: 'category'
  }
];
