import { userService } from '../user';
import hashingCompare from '../utils/hashing-compare';
import { BaseError, errorCode } from '../utils';
import companyService from '../../search/company/company.service';

/**
 *
 * @param {'user' | 'company'} authType default is user
 */
const pinAuthorization = (authType = 'user') => async (req, res, next) => {
  try {
    const { PIN, type } = req.validate;

    let user = await userService.findById(req.user.id);
    let hashChecker = user.PIN;
    let company = null;
    if (authType === 'company') {
      company = await companyService.findByUserId(
        req.user.id,
        '+wallet +total_pay +total_withdraw +pin'
      );
      if (type === 'withdraw_company') {
        if (!company.active_pin) {
          return next(
            new BaseError({
              statusCode: 400,
              error: errorCode.authorization,
              errors: { company: errorCode['auth.notActive'] }
            }).addMeta({ message: "company hasn't active pin" })
          );
        }
      }

      company.id = company._id;
      hashChecker = company.pin;
    }
    if (user) {
      if (type === 'deposit' || type === 'deposit_company') {
        req.user = user;
        req.user.id = user._id;
        if (company) req.company = company;
        return next();
      }
      const checker = await hashingCompare.compareHashCode(PIN, hashChecker);

      if (!checker) {
        return next(
          new BaseError({
            statusCode: 403,
            error: errorCode.client,
            errors: {
              PIN: errorCode['client.wrongPIN']
            }
          })
        );
      }
      req.user = user;
      req.user.id = user._id;
      if (company) req.company = company;
      delete req.validate.PIN;
      return next();
    }
    return next(
      new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { token: errorCode['client.tokenTimeOut'] }
      })
    );
  } catch (err) {
    return next(err);
  }
};

export default { pinAuthorization };
