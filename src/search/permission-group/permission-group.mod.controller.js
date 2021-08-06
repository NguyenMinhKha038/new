import permissionGroupService from './permission-group.service';
import { BaseResponse, BaseError } from '../../commons/utils';

async function findGroup(req, res, next) {
  try {
    // let query = {
    //   ...req.validate,
    //   user_id: req.user.id
    // };
    let populate = [
      { path: 'store_id', select: 'name' },
      {
        path: 'company_id',
        select:
          'name representer cover_image logo tax_code images type_category_id category_id status'
      }
    ];
    let response = await permissionGroupService.findOne({ user_id: req.user.id }, populate);
    return res.send(new BaseResponse({ statusCode: 200, data: response }));
  } catch (err) {
    return next(err);
  }
}

async function findById(req, res, next) {
  try {
    let response = await permissionGroupService.find({ query: req.validate });
    return res.send(new BaseResponse({ statusCode: 200, data: response }));
  } catch (err) {
    return next(err);
  }
}

export default {
  findGroup,
  findById
};
