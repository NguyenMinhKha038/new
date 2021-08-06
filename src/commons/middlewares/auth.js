import BaseError from '../utils/base-error';
import Errors from '../../commons/utils/error-code';
import passport from 'passport';
import passportJwt from 'passport-jwt';
import permissionService from '../permission/permission.service';
import permissionGroupService from '../group-permisison/group-permission.service';
import companyPermissionService from '../../search/permission/permission.service';
import companyPermissionGroupService from '../../search/permission-group/permission-group.service';
import { adminService } from '../admin';
import companyService from '../../search/company/company.service';
import _, { omit } from 'lodash';
import user, { userService } from '../user';
import errorCode from '../../commons/utils/error-code';
import mallService from '../../search/sum-mall/mall/mall.service';
import mallStaffService from '../../search/sum-mall/staff/staff.service';
import { MallStaffStatuses, MallStaffRoles } from '../../search/sum-mall/staff/staff.config';
import mallStaffPermissionService from '../../search/sum-mall/staff/staff.service';
import { StockPermission } from '../../search/goods-batch/goods-batch.config';
import warehouseService from '../../search/warehouse/warehouse.service';
import storeService from '../../search/store/store.service';
import { CompanyStaffRoles } from '../../search/permission-group/permission-group.config';

const ExtractJwt = passportJwt.ExtractJwt;
const JwtStrategy = passportJwt.Strategy;

function init() {
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.APP_SECRET_KEY
      },
      async (payload, cb) => {
        try {
          const auth = payload.role
            ? await adminService.findOne({ _id: payload.id })
            : await userService.findActive(
                payload.id,
                'wallet name ref_id PIN phone avatar is_lucky user_version'
              );
          if (auth) {
            if (!payload.role && auth.user_version && auth.user_version !== payload.user_version) {
              // throw new BaseError({
              //   statusCode: 401,
              //   error: errorCode.authorization,
              //   errors: { token: errorCode['token.expired'] }
              // }).addMeta({ message: 'need login again' });
            }
            cb(null, payload.role ? payload : auth);
          } else {
            cb(null, false);
          }

          // auth ? cb(null, payload.role ? payload : auth) : cb(null, false);
        } catch (error) {
          cb(error, false);
        }
      }
    )
  );
}

function isAuthorized(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }

    if (user && !user.role) {
      // if (user.user_version && user.old_user_version !== user.user_version) {
      //   return next(

      //   );
      // }
      req.user = user;
      return next();
    }
    return next(
      new BaseError({
        statusCode: 401,
        error: errorCode.authorization,
        errors: { Unauthorized: errorCode['auth.unAuthorized'] }
      })
    );
  })(req, res, next);
}

function noNeedAuthorized(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    req.user = user || null;
    next();
  })(req, res, next);
}

async function isUserOrAdminAuthorized(req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err || !user) {
      return next(
        new BaseError({
          statusCode: 401,
          error: errorCode.authorization,
          errors: { Unauthorized: errorCode['auth.unAuthorized'] }
        })
      );
    } else if (user.role == 'adminT_T') {
      req.admin = user;
      next();
    } else {
      req.user = user;
      next();
    }
  })(req, res, next);
}

async function isAdminAuthorized(req, res, next) {
  //authen with jwt in req.header (req = request), default authen with jwt in header
  passport.authenticate('jwt', { session: false }, (err, admin) => {
    if (err || !admin || !admin.id || admin.role != 'adminT_T') {
      // if fail
      return next(
        new BaseError({
          statusCode: 401,
          error: errorCode.authorization,
          errors: { Unauthorized: errorCode['auth.unAuthorized'] }
        })
      );
    }
    req.admin = admin;
    next();
  })(req, res, next);
}

async function isAdminPermission(req, res, next) {
  try {
    let admin = await adminService.findOne({ _id: req.admin.id });
    admin = _.omit(admin, ['password']);
    if (admin && admin.status !== 'active')
      return next(new BaseError({ statusCode: 400, error: 'admin is disabled' }));
    if (admin && admin.user_name === process.env.ADMIN_USER_NAME) return next();
    else {
      let url = req.baseUrl;
      let permissionPath = url.substring(4, url.length);
      let permission = await permissionService.findOne({
        path: permissionPath
      });

      if (permission) {
        let pathName = req._parsedUrl.pathname;
        if (
          permission.path.toString() == '/permission-group' &&
          pathName.toString() != '/permission-group/get-permission-groups'
        ) {
          if (req.query.id.toString() == admin.permission_group_id._id.toString()) {
            return next();
          }
        }
        let permissionGroup = await permissionGroupService.findById(admin.permission_group_id._id);
        let permissionIdList = permissionGroup.permission_ids;
        //check permission
        for (let i = 0; i < permissionIdList.length; i++) {
          if (permissionIdList[i]._id.toString() == permission._id.toString()) {
            return next();
          }
        }
      }
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.authorization,
          errors: {}
        }).addMeta({ message: Errors['permission.notAllow'] })
      );
    }
  } catch (err) {
    return next(err);
  }
}

export const isMallModPermission = (roles = []) => async (req, res, next) => {
  try {
    const { _id: user_id } = req.user;
    const staff = await mallStaffService.findOne(
      {
        user_id,
        status: MallStaffStatuses.Active
      },
      null,
      {
        populate: [
          { path: 'mall', select: '_id id status name email phone_number' },
          {
            path: 'user',
            match: { status: { $ne: 'disabled' } }
          }
        ]
      }
    );
    if (!staff || !staff.mall || !staff.user) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          auth: errorCode['auth.notActive']
        }
      });
    }
    req.mall = {
      ...staff.mall.toObject(),
      mall_id: staff.mall_id,
      user_id: staff.user_id,
      staff_id: staff._id,
      is_mall_manager: staff.roles.includes(MallStaffRoles.MallManager) ? true : undefined,
      type: staff.roles
    };
    if (roles.length) {
      const isValidRoles = checkValidRoles(roles, staff.roles);
      if (!isValidRoles) {
        throw new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: {
            auth: errorCode['auth.unAuthorized']
          }
        });
      }
    }
    return next();
  } catch (error) {
    next(error);
  }
};

function checkValidRoles(roles, baseRoles) {
  for (const role of baseRoles) {
    if (roles.includes(role)) {
      return true;
    }
  }
  return false;
}
async function isCompanyStaff(req, res, next) {
  try {
    const { id } = req.user;
    const permissionGroup = await companyPermissionGroupService.findOne({
      user_id: id,
      status: 'active'
    });
    if (!permissionGroup) {
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          permission: Errors['permission.notAllow']
        }
      });
    }
    req.company_staff = permissionGroup;
    return next();
  } catch (error) {
    next(error);
  }
}
async function isCompanyModPermission(req, res, next) {
  try {
    const { id } = req.user;
    let path = req.baseUrl;
    const prefixPath = '/api';
    const startPosition = prefixPath.length;
    path = path.substring(startPosition, path.length);
    let method = req.method;

    const permissionGroup = await companyPermissionGroupService.findOne({ user_id: id });
    if (!permissionGroup) {
      return next(
        new BaseError({
          statusCode: 400,
          error: Errors.authorization,
          errors: {
            permission: Errors['permission.notAllow']
          }
        }).addMeta({ message: 'permission.notAllow' })
      );
    }

    const {
      is_owner,
      store_id,
      warehouse_id,
      company_id,
      status: permissionGroupStatus,
      type
    } = permissionGroup;

    const company = await companyService.findOne(
      { _id: company_id },
      '+wallet user_id name type_category_id category_id level status online_sales'
    );
    if (!company)
      throw new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { company: errorCode['client.companyNotExist'] }
      });
    // console.timeEnd('getCompany');
    if (permissionGroupStatus === 'active' || is_owner) {
      req.company = {
        ...company.toObject(),
        is_owner: is_owner,
        id: company_id,
        store_id: store_id,
        warehouse_id: warehouse_id,
        _id: company_id,
        permission_group_id: permissionGroup._id
        // type: permission && permission.type
      };
      if (is_owner) {
        req.company_permission = { is_owner };
        return next();
      }
      const permission = await companyPermissionService.find({
        path_list: path,
        method,
        type: { $in: type }
      });

      if (permission && permission.length) {
        req.company.type = permission.map((item) => item.type);
        req.company_permission = permission;
        return next();
      } else {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: { permission: errorCode['permission.notAllow'] }
          }).addMeta({ message: 'permission not allow' })
        );
      }
      // for (let i = 0; i < permission.length; i++) {
      //   if (permissionGroup.type.indexOf(permission[i].type) >= 0) {
      //     return next();
      //   }
      // }
    }
    return next(
      new BaseError({
        statusCode: 400,
        error: Errors.authorization,
        errors: { permission: Errors['permission.notAllow'] }
      }).addMeta({ message: 'permission.notAllow' })
    );
  } catch (err) {
    return next(err);
  }
}

/**
 *
 *
 * @param {("pending"|"rejected"|"approved"|"suspend")[]} status
 * @returns {Function}
 */
function canCompanyEnter(...status) {
  return (req, res, next) => {
    try {
      const company = req.company;
      if (!company || !status.includes(company.status))
        throw new BaseError({
          statusCode: 401,
          error: errorCode.client,
          errors: {
            permission: errorCode['company.canNotEnter']
          }
        });
      next();
    } catch (error) {
      next(error);
    }
  };
}

async function canGetKYC(req, res, next) {
  try {
    if (req.user) {
      let url = req.originalUrl;
      const regex = /private\/images\/[0-9]*\.([0-9a-fA-F]*)(\.|\_)[a-z\._]*/;
      let compareId = url.match(regex)[1];
      if (compareId == req.user.id) {
        return next();
      } else {
        return next(
          new BaseError({
            statusCode: 404,
            error: Errors.authorization,
            errors: { id: Errors['autho.notMatch'] }
          })
        );
      }
    } else if (req.admin) {
      if (req.admin.user_name === process.env.ADMIN_USER_NAME) {
        return next();
      } else {
        let admin = await adminService.findOne({ _id: req.admin.id });
        let permissionGroup = await permissionGroupService.findById(
          admin.permission_group_id['_id']
        );
        let permissionIdList = permissionGroup.permission_ids;

        if (permissionIdList && permissionIdList.length > 0) {
          for (let i = 0; i < permissionIdList.length; i++) {
            if (permissionIdList[i].path == '/user/admin') return next();
          }
        }
        return next(
          new BaseError({
            statusCode: 404,
            error: Errors.authorization,
            errors: { id: Errors['autho.notMatch'] }
          })
        );
      }
    }
  } catch (err) {
    return next(err);
  }
}
async function hasStockPermission(req, res, next) {
  try {
    const { id: userId, name, phone } = req.user;

    const [userCompanyPermission, userMallPermission] = await Promise.all([
      companyPermissionGroupService.findOneActive({ user_id: userId }),
      mallStaffPermissionService.findOneActive({ user_id: userId })
    ]);
    if (!userCompanyPermission && !userMallPermission) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.authorization,
          errors: {
            permission: errorCode['permission.notAllow']
          }
        }).addMeta({ message: 'user not authorized' })
      );
    }
    const omittedFields = ['_id', 'createdAt', 'updatedAt', 'user_id'];
    const { id: permission_group_id, type: companyStaffRoles = [], ...userCompPer } = omit(
      userCompanyPermission ? userCompanyPermission.toObject() : {},
      omittedFields
    );
    const { id: mall_staff_permission_id, type: mallStaffRoles = [], ...userMallPer } = omit(
      userMallPermission ? userMallPermission.toObject() : {},
      omittedFields
    );
    const stockPermission = {
      ...userCompPer,
      ...userMallPer,
      name,
      phone,
      permission_group_id,
      mall_staff_permission_id,
      user_id: userId.toString(),
      type: [...companyStaffRoles, ...mallStaffRoles],
      staff_of: [],
      mall_ids: userCompPer.mall_id ? [userMallPer.mall_id.toString()] : [],
      warehouse_ids: userCompPer.warehouse_id ? [userCompPer.warehouse_id.toString()] : [],
      store_ids: userCompPer.store_id ? [userCompPer.store_id.toString()] : []
    };

    if (stockPermission.is_owner) {
      const [warehouses, stores] = await Promise.all([
        warehouseService.findManyActive({ company_id: stockPermission.company_id }),
        storeService.findManyActive({ company_id: stockPermission.company_id })
      ]);
      stockPermission.warehouse_ids = warehouses.map((warehouse) => warehouse.id);
      stockPermission.store_ids = stores.map((store) => store.id);
      stockPermission.staff_of.push('warehouse', 'store');
      stockPermission.type.push(CompanyStaffRoles.Owner);
    } else {
      if (stockPermission.mall_id) {
        stockPermission.staff_of.push('mall');
      }
      if (stockPermission.warehouse_id) {
        stockPermission.staff_of.push('warehouse');
      }
      if (stockPermission.store_id) {
        stockPermission.staff_of.push('store');
      }
    }

    const staffType = stockPermission.type;
    if (staffType.some((type) => StockPermission.includes(type))) {
      req.stock_permission = stockPermission;

      return next();
    }

    return next(
      new BaseError({
        statusCode: 401,
        error: errorCode.authorization,
        errors: {
          permission: errorCode['permission.notAllow']
        }
      }).addMeta({ message: 'user not authorized' })
    );
  } catch (err) {
    next(err);
  }
}
export default {
  isAuthorized,
  isAdminAuthorized,
  isAdminPermission,
  isUserOrAdminAuthorized,
  isCompanyModPermission,
  canGetKYC,
  noNeedAuthorized,
  init,
  canCompanyEnter,
  isMallModPermission,
  isCompanyStaff,
  hasStockPermission
};
