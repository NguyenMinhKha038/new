import { CompanySensitiveExcludes } from '../../company/company.config';

export const Statuses = {
  Pending: 'pending',
  Disabled: 'disabled',
  Inactive: 'inactive',
  Approved: 'approved',
  Rejected: 'rejected'
};

export const queryStatus = {
  Pending: 'pending',
  Approved: 'approved',
  Rejected: 'rejected',
  Inactive: 'inactive'
};

export const ProviderStatuses = {
  Active: 'active',
  Inactive: 'inactive'
};

export const CategoryPopulateFields = [
  {
    path: 'type_category',
    select: 'name pure_name'
  },
  {
    path: 'company_category',
    select: 'name pure_name'
  }
];
export const TemplatePopulateFields = [
  {
    path: 'attributes.product_attribute',
    select: 'name values allow_unlisted_value display_name'
  }
];
export const PopulatedFields = [
  {
    path: 'attributes.product_attribute',
    select: 'name display_name'
  },
  {
    path: 'productStorings',
    populate: [{ path: 'store' }]
  },
  {
    path: 'promotion',
    match: {
      start_at: { $lt: new Date() },
      expire_at: { $gt: new Date() }
    }
  },
  {
    path: 'category',
    select: 'name'
  },
  {
    path: 'company_category',
    select: 'name'
  },
  {
    path: 'sub_category',
    select: 'name'
  },
  {
    path: 'company'
  },
  {
    path: 'product_template',
    populate: 'attributes.product_attribute'
  },
  {
    path: 'providers.provider',
    select: 'location status address type name user_id company_id'
  },
  { path: 'company', select: CompanySensitiveExcludes },
  {
    path: 'promotion',
    match: {
      start_at: { $lt: new Date() },
      expire_at: { $gt: new Date() },
      status: 'active'
    }
  }
];
export const AdminPopulatedFields = [
  {
    path: 'attributes.product_attribute',
    select: 'name'
  },
  {
    path: 'productStorings',
    populate: [{ path: 'store' }]
  },
  {
    path: 'promotion',
    match: {
      start_at: { $lt: new Date() },
      expire_at: { $gt: new Date() }
    }
  },
  {
    path: 'category',
    select: 'name'
  },
  {
    path: 'company_category',
    select: 'name'
  },
  {
    path: 'sub_category',
    select: 'name'
  },
  {
    path: 'company',
    select: '+wallet'
  }
];
