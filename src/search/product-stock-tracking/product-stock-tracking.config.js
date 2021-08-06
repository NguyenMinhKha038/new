export const PopulatedFields = [
  { path: 'user', select: '_id phone name avatar' },
  { path: 'from_store', select: '_id name address location status' },
  { path: 'to_store', select: '_id name address location' },
  { path: 'from_mall', select: '_id name address location status' },
  { path: 'to_mall', select: '_id name address location' },
  { path: 'from_warehouse', select: '_id name address location status' },
  { path: 'to_warehouse', select: '_id name address location' },
  { path: 'company', select: '_id name logo email phone address' }
];

export const TrackingPlaces = {
  Warehouse: 'warehouse',
  Store: 'store',
  Mall: 'mall'
};

export const Types = {
  Import: 'import',
  Export: 'export',
  LocalImport: 'local_import',
  LocalExport: 'local_export',
  Sell: 'sell',
  Refund: 'refund',
  Move: 'move',
  Edit: 'edit'
};

export default {
  PopulatedFields,
  TrackingPlaces,
  Types
};
