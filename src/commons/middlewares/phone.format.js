const phoneFormat = (reqField, key) => (req, res, next) => {
  let phone = req[reqField][key];
  if (phone) {
    if (phone.indexOf('+84') >= 0) return next();
    let phoneRegex = /0[3|5|7|8|9][0-9]/;
    let first3Char = phone.substring(0, 3);
    if (phoneRegex.test(first3Char)) {
      phone = '+84' + phone.slice(1);
      req[reqField][key] = phone;
    }
  }
  return next();
};

export default { phoneFormat };
