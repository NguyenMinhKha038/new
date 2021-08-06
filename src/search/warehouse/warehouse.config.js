export const PopulatedFields = [
  { path: 'company', select: 'name status address' },
  {
    path: 'manager',
    select: 'name avatar phone'
  }
];
export const QueryStatuses = {
  Active: 'active',
  Inactive: 'inactive',
  Disabled: 'disabled'
};
export const Statuses = {
  Active: 'active',
  Inactive: 'inactive'
};
export const DeletedStatus = 'disabled';
