export const Statuses = { Active: 'active', Disabled: 'disabled' };

export const PopulatedFields = [
  {
    path: 'store',
    select: 'name address location max_refund max_discount discount_rate'
  },
  {
    path: 'mall',
    select: 'name address location max_refund max_discount discount_rate'
  },
  { path: 'company', select: 'name status address' },
  { path: 'admin', select: 'name status' }
];
