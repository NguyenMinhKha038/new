export const CompanySensitiveFields = [
  'chat_password',
  'chat_username',
  'email',
  'phone_number',
  'representer',
  'tax_code',
  'admin_note',
  'balance_limit',
  'level',
  'notification_status',
  'active_pin',
  'business_registration_form',
  'wallet',
  'locked_wallet',
  'refund_fund',
  'total_refund',
  'total_discount',
  'total_pay',
  'total_revenue',
  'total_order',
  'total_staff',
  'pin'
];

export const CompanySensitiveExcludes = CompanySensitiveFields.reduce(
  (prev, curt) => ({
    ...prev,
    [curt]: 0
  }),
  {}
);

export default {
  sensitiveFields: CompanySensitiveFields,
  sensitiveExcludes: CompanySensitiveExcludes
};
