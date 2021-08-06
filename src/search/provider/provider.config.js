export const PopulatedFields = [
  { path: 'admin', select: 'name email status' },
  { path: 'user', select: 'name status' },
  { path: 'company', select: 'name location address logo cover_image' }
];
export const Statuses = {
  Active: 'active',
  Disabled: 'disabled'
};

export default {
  PopulatedFields,
  Statuses
};
