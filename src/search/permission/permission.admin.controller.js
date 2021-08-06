import COMP_PERMISSION_LIST from './init-permission.company.json';
import permissionModel from './permission.model';
import permissionService from './permission.service';
import { BaseResponse, BaseError, errorCode } from '../../commons/utils';
import writeJsonFile from 'write-json-file';
import _ from 'lodash';

async function create(req, res, next) {
  try {
    const data = req.validate;
    const { type, method } = data;
    const permission = await permissionService.findOne({ type, method });

    if (permission) {
      return new BaseError({
        statusCode: 400,
        error: errorCode.client,
        errors: {
          permission: errorCode['client.existed']
        }
      })
        .addMeta({ message: 'permission has already existed' })
        .return(res);
    }

    const newPermission = await permissionService.create(data);
    return new BaseResponse({ statusCode: 200, data: newPermission }).return(res);
  } catch (err) {
    return next(err);
  }
}

async function findPermissions(req, res, next) {
  try {
    const { limit, page, sort, ...query } = req.validate;
    // let limit = value.limit ? parseInt(value.limit, 10) : 0;
    const totalItem = await permissionService.count(query);
    const totalPage = limit === 0 ? 1 : Math.ceil(totalItem / limit);
    const skip = page ? limit * (value.page - 1) : 0;

    const permissionsList = await permissionService.find(query, {}, { limit, skip, sort });
    return res.send(
      new BaseResponse({ statusCode: 200, data: permissionsList }).addMeta({
        totalPage,
        page: req.body.page,
        total: totalItem
      })
    );
  } catch (err) {
    return next(err);
  }
}

async function findOneById(req, res, next) {
  try {
    let value = req.validate;
    let permission = await permissionService.findById(value.id);
    return res.send(new BaseResponse({ statusCode: 200, data: permission }));
  } catch (err) {
    return next(err);
  }
}

async function findOneAndUpdate(req, res, next) {
  try {
    const { id: _id, ...updated } = req.validate;
    const permission = await permissionService.findOneAndUpdate({ _id }, updated);
    return new BaseResponse({ statusCode: 200, data: permission }).return(res);
  } catch (err) {
    return next(err);
  }
}

async function findOneAndDelete(req, res, next) {
  try {
    let value = req.validate;
    await permissionService.findOneAndDelete({ _id: value.id });
    return res.send(new BaseResponse({ statusCode: 200 }));
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res, next) {
  try {
    // Only system admin can refresh permission list
    if (req.admin.user_name !== process.env.ADMIN_USER_NAME) {
      throw new BaseError({
        statusCode: 401,
        error: errorCode.authorization,
        errors: errorCode['permission.notAllow']
      });
    }

    // For update/insert permissions from/to db
    const upsertJobs = [];
    let nUpdated = 0;
    let nInserted = 0;
    let total = 0;

    if (req.params.type === 'company' && COMP_PERMISSION_LIST.length) {
      const permissionsFromFile = COMP_PERMISSION_LIST;
      const currentPermissions = await permissionService.find();
      total = currentPermissions.length;

      permissionsFromFile.forEach((permissionFromFile) => {
        const existed = currentPermissions.find(
          (currPer) =>
            currPer.type === permissionFromFile.type && currPer.method === permissionFromFile.method
        );

        if (existed) {
          existed.path_list = [...new Set([...permissionFromFile.path_list, ...existed.path_list])];
          upsertJobs.push(existed.save());
          nUpdated += 1;
        } else {
          const newPermission = new permissionModel(permissionFromFile);
          currentPermissions.push(newPermission);
          upsertJobs.push(newPermission.save());
          nInserted += 1;
          total += 1;
        }
      });

      // Update/insert permissions from/to db
      await Promise.all(upsertJobs);

      // Save updated permission list
      const dataToSave = currentPermissions.map((per) => per.toJSON());
      await writeJsonFile('./src/search/permission/init-permission.company.json', dataToSave);
    }

    return new BaseResponse({ statusCode: 200, data: { total, nUpdated, nInserted } }).return(res);
  } catch (err) {
    return next(err);
  }
}

export default {
  create,
  findPermissions,
  findOneAndUpdate,
  findOneAndDelete,
  findOneById,
  refresh
};
