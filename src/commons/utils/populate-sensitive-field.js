function populateSensitive(populate) {
  const sensitivePopulate = {
    path: populate || '',
    select:
      '-password -token -PIN -login_type -mail_verify -device_token -verify_code -verify_expired -verify_wrong_times'
  };
  return sensitivePopulate;
}
export default populateSensitive;
