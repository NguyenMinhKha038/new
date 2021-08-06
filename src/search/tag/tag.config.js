export const Statuses = { Active: 'active', Disabled: 'disabled' };

export const Types = { Permanent: 'permanent', Flash: 'flash' };

export const Scopes = { Global: 'global', Company: 'company', Store: 'store', Mall: 'mall' };

export const MinFlashTime = 1 * 1 * 60 * 60 * 1000; // 1 hour

export const MaxFlashTime = 30 * 24 * 60 * 60 * 1000; // 30 days

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
