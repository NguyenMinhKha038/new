export const Statuses = {
  Pending: 'pending',
  Active: 'active',
  Disabled: 'disabled'
};

export const CategoryTree = ['type_category_id', 'company_category_id', 'sub_category_id'];

export const PopulatedFields = [
  {
    path: 'category',
    select: 'name company_category_id type_category_id sub_category_id',
    populate: [
      {
        path: 'company_category',
        select: 'name type'
      },
      {
        path: 'type_category',
        select: 'name type image'
      },
      {
        path: 'sub_category',
        select: 'name type'
      }
    ]
  },
  {
    path: 'attributes.product_attribute',
    select: 'name values allow_unlisted_value display_name'
  }
];
