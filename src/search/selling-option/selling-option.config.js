export const Statuses = { Active: 'active', Disabled: 'disabled' };

export const Types = { Option: 'option', Selection: 'selection' };

export const Scopes = {
  Global: 'global',
  Company: 'company',
  Store: 'store',
  Mall: 'mall'
};

export const Units = {
  NA: 'na',
  Percent: 'percent',
  Kilogram: 'kilogram',
  Gram: 'gram',
  Liter: 'liter',
  Centimeter: 'centimeter',
  Meter: 'meter',
  Quantity: 'quantity',
  Byte: 'byte',
  Kilobyte: 'kilobyte',
  Megabyte: 'megabyte',
  Gigabyte: 'gigabyte',
  Terabyte: 'terabyte'
};

export const PopulatedFields = [
  {
    path: 'store',
    select: 'name address location max_refund max_discount discount_rate'
  },
  { path: 'company', select: 'name status address' }
];
