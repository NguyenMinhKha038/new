import permissionGroupService from './permission-group.service';
import { BaseResponse, BaseError, errorCode } from '../../commons/utils';
import _ from 'lodash';
import companyService from '../company/company.service';
import storeService from '../store/store.service';
import { userService } from '../../commons/user';
import { companyPermissionType } from './permission-group.config';
import warehouseService from '../warehouse/warehouse.service';

async function create(req, res, next) {
  try {
    let { phone_number, store_id, warehouse_id, type } = req.validate;
    const user = await userService.findOne({
      phone: phone_number,
      verify: true
    });
    if (!user) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.authorization,
          errors: { user: errorCode['autho.notexisted'] }
        }).addMeta({ message: 'user is not active' })
      );
    }

    if (user._id === req.user.id) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { phone_number: errorCode['client.staff.yourself'] }
        }).addMeta({ message: 'yourself' })
      );
    }
    const { _id: company_id } = req.company;
    // console.log('COMPANY ID', req.company);
    // const [staff, store] = await Promise.all([
    //   permissionGroupService.findOne({ user_id: user._id }),
    //   storeService.findOne({ _id: store_id, company_id: req.comapny._id })
    // ]);
    const staff = await permissionGroupService.findOne({ user_id: user._id });
    let record = null;
    if (staff) {
      if (staff.status !== 'disabled' || staff.is_owner) {
        return next(
          new BaseError({
            statusCode: 400,
            error: errorCode.authorization,
            errors: { user: errorCode['autho.existed'] }
          }).addMeta({ message: 'user is employee of other one' })
        );
      }
      // if (warehouse_id) {
      if (type.some((t) => ['warehouse_stock', 'warehouse_manager'].includes(t))) {
        // Forgive me, this for hotfix only T_T
        const warehouse = await warehouseService.findOneActive({ company_id });
        staff.warehouse_id = warehouse._id;
      }
      if (store_id) {
        const store = await storeService.findOne({ _id: store_id, company_id: company_id });
        if (!store) {
          return next(
            new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { store_id: errorCode['client.storeNotExist'] }
            }).addMeta({ message: 'store is not found' })
          );
        }
        staff.store_id = store_id;
      } else {
        if (staff.store_id) {
          delete staff.store_id;
        }
        if (staff.warehouse_id) {
          delete staff.warehouse_id;
        }
      }
      staff.company_id = company_id;
      staff.status = 'active';
      // staff.store_id = store_id;
      staff.type = type;
      record = await staff.save();
    }
    if (!staff) {
      if (type.some((t) => ['warehouse_stock', 'warehouse_manager'].includes(t))) {
        // Forgive me, this for hotfix only T_T
        const warehouse = await warehouseService.findOneActive({ company_id });
        req.validate.warehouse_id = warehouse._id;
      } else if (store_id) {
        const store = await storeService.findOne({ _id: store_id, company_id: company_id });
        if (!store) {
          return next(
            new BaseError({
              statusCode: 400,
              error: errorCode.client,
              errors: { store_id: errorCode['client.storeNotExist'] }
            }).addMeta({ message: 'store is not found' })
          );
        }
      }
      req.validate.company_id = company_id;
      req.validate.user_id = user._id;
      record = await permissionGroupService.create(req.validate);
    }
    await record
      .populate([
        { path: 'user_id', select: 'name phone avatar' },
        { path: 'store_id', select: 'name location address' },
        { path: 'warehouse_id', select: 'name location address' }
      ])
      .execPopulate();
    const totalStaff = await permissionGroupService.count({
      company_id: req.company_id,
      status: 'active'
    });
    companyService.update(req.company.id, { total_staff: totalStaff });
    //*

    return res.send(new BaseResponse({ statusCode: 201, data: record }));
  } catch (err) {
    return next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { id, status } = req.validate;
    const [permissionGroup, company] = await Promise.all([
      permissionGroupService.findById(id),
      companyService.findByUserId(req.user.id)
    ]);

    if (!permissionGroup) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { id: errorCode['client.global.notFound'] }
        }).addMeta({ message: 'staff is not found' })
      );
    }

    // if (store_id) {
    //   const store = await storeService.findOne({ _id: store_id, company_id:company_id });
    //   if (!store) {
    //     return next(
    //       new BaseError({
    //         statusCode: 400,
    //         error: errorCode.client,
    //         errors: { store_id: errorCode['client.storeNotExist'] }
    //       }).addMeta({ message: 'store is not found' })
    //     );
    //   }
    // }

    if (permissionGroup.user_id === req.user.id) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { user: errorCode['client.staff.yourself'] }
        }).addMeta({ message: 'yourself' })
      );
    }

    if (
      permissionGroup.is_owner ||
      permissionGroup.company_id.toString() !== company._id.toString()
    ) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.authorization,
          errors: { id: errorCode['permission.notAllow'] }
        }).addMeta({ message: 'not allowed' })
      );
    }
    if (status === permissionGroup.status) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { status: errorCode['client.staff.repeatStatus'] }
        }).addMeta({ message: 'repeat status' })
      );
    }
    permissionGroup.status = status;
    let response = await permissionGroup.save();

    permissionGroupService
      .count({
        company_id: permissionGroup.company_id,
        status: 'active'
      })
      .then((total_staff) => {
        companyService.update(permissionGroup.company_id, { total_staff });
      });

    return res.send(new BaseResponse({ statusCode: 201, data: response }));
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const storePermissionList = [
      'cashier',
      'store_stock',
      'seller',
      'store_manager'
      //  T_T
    ];
    const { id, type } = req.validate;
    let permissionGroup = await permissionGroupService.findById(id);
    const company = req.company;
    if (
      permissionGroup &&
      company &&
      permissionGroup.company_id.toString() === company._id.toString()
    ) {
      let updateData = _.omit(req.validate, ['id']);

      if (type) {
        let isStorePermission = false;
        for (const i in type) {
          const permission = type[i];
          const index = storePermissionList.findIndex((item) => item === permission);
          if (index >= 0) {
            isStorePermission = true;
            break;
          }
        }
        if (!isStorePermission) {
          if (updateData.store_id) {
            delete updateData.store_id;
          }
          updateData = { ...updateData, $unset: { store_id: 1 } };
        } else if (
          !type.filter((t) => ['warehouse_stock', 'warehouse_manager'].includes(t)).length
        ) {
          // Forgive me, this for hotfix only T_T
          delete updateData.warehouse_id;
          updateData = { ...updateData, $unset: { warehouse_id: 1 } };
        }
      }
      if (type && type.some((t) => ['warehouse_manager', 'warehouse_stock'].includes(t))) {
        // Forgive me, this for hotfix only T_T
        const warehouse = await warehouseService.findOneActive({ company_id: company._id });
        updateData.warehouse_id = warehouse._id;
      }
      let response = await permissionGroupService.findOneAndUpdate({ _id: id }, { ...updateData }, [
        { path: 'user_id', select: 'name avatar phone' },
        { path: 'store_id', select: 'name address location' },
        { path: 'warehouse_id', select: 'name address location' }
      ]);
      return res.send(new BaseResponse({ statusCode: 201, data: response }));
    }
    return next(
      new BaseError({
        statusCode: 400,
        error: errorCode.authorization,
        errors: { id: errorCode['permission.notAllow'] }
      }).addMeta({ message: 'not allowed' })
    );
  } catch (err) {
    return next(err);
  }
}

async function findUserMods(req, res, next) {
  try {
    // let value = req.validate;
    let { limit, page, sort, skip, level, ...query } = req.validate;
    limit = limit || 0;
    skip = page ? (page - 1) * limit : 0;

    const populate = [
      { path: 'store_id', select: ['_id', 'name', 'location', 'address'] },
      { path: 'user_id', select: ['_id', 'name', 'phone', 'avatar'] }
    ];
    // let company = await companyService.findOne({ user_id: req.user.id });
    const permissionGroup = await permissionGroupService.findOne({ user_id: req.user.id });
    if (!permissionGroup) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { user_id: errorCode['client.staff.notExisted'] }
        }).addMeta({ message: 'staff not existed' })
      );
    }

    console.log('permission', permissionGroup);
    if (!permissionGroup.is_owner && level) {
      return new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: { level: errorCode['client.typeNotAllow'] },
        message: 'level is not allow'
      }).return(res);
    }
    // const query = value;

    query.company_id = permissionGroup.company_id;

    const { cashier, seller, store_manager, store_stock } = companyPermissionType;
    if (!permissionGroup.is_owner && permissionGroup.type.includes(store_manager)) {
      query.store_id = permissionGroup.store_id;
      query.type = { $in: [cashier, seller, store_manager, store_stock] };
    }
    if (permissionGroup.is_owner && level) {
      if (level === 'company') {
        query.store_id = { $exists: false };
      }
      if (level === 'store') {
        if (query.store_id) {
          query.$or = [{ store_id: query.store_id }, { store_id: { $exists: true } }];
        } else {
          query.store_id = { $exists: true };
        }
      }
      // if(level === 'store')
    }
    const total = await permissionGroupService.count(query);
    const totalPage = limit > 0 ? Math.ceil(total / limit) : 1;

    const listMods = await permissionGroupService.find({
      query: { ...query },
      sort,
      limit,
      skip,
      populate
    });
    return res.send(
      new BaseResponse({ statusCode: 200, data: listMods }).addMeta({
        totalPage,
        total
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function findByGroupType(req, res, next) {
  try {
    let groupDetail = await permissionGroupService.find({
      query: req.validate
    });
    return res.send(new BaseResponse({ statusCode: 200, data: groupDetail }));
  } catch (err) {
    return next(err);
  }
}

async function findUserModById(req, res, next) {
  try {
    let populate = [
      { path: 'user_id', select: ['_id', 'name', 'phone', 'avatar'] },
      { path: 'store_id', select: ['_id', 'name', 'location', 'address'] }
    ];
    let mod = await permissionGroupService.findById(req.validate.id, populate);
    return res.send(new BaseResponse({ statusCode: 200, data: mod }));
  } catch (err) {
    return next(err);
  }
}

async function updatePermissionUser(req, res, next) {}

async function deleteUser(req, res, next) {
  try {
    await permissionGroupService.findOneAndDelete({ _id: req.validate.id });

    //* change count
    companyService.changeCount(req.validate.company_id, { total_staff: -1 });
    storeService.changeCount(req.validate.store_id, { total_staff: -1 });
    //*

    return res.send(new BaseResponse({ statusCode: 200 }));
  } catch (err) {
    return next(err);
  }
}

export default {
  create,
  findByGroupType,
  findUserModById,
  findUserMods,
  deleteUser,
  updateStatus,
  update
};
