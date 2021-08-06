import { BaseError, errorCode, BaseResponse, withSafety } from '../../commons/utils';
import { CompanyActions } from '../company-activity/company-activity.config';
import companyActivityService from '../company-activity/company-activity.service';
import companyBankService from './companyBank.service';

// import companyBankService from './user-bank.service';

const create = async (req, res, next) => {
  try {
    const { is_default, ...data } = req.validate;
    const company = req.company;
    const userId = req.user.id;
    const createdData = {
      user_id: userId,
      company_id: company._id,
      ...data
    };
    const bank = await companyBankService.findOne({
      query: createdData
    });
    if (bank) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { bank: errorCode['client.global.existed'] }
        }).addMeta({ message: 'bank is existed' })
      );
    }
    const count = await companyBankService.count({ user_id: req.user.id, company_id: company._id });
    if (!count) {
      createdData.is_default = true;
    } else if (is_default) {
      const oldBank = await companyBankService.findOne({
        query: {
          user_id: userId,
          company_id: company._id,
          is_default: true
        }
      });
      if (oldBank) {
        oldBank.is_default = false;
        oldBank.save();
      }
      createdData.is_default = is_default;
    }
    const userBank = await companyBankService.create(createdData);
    withSafety(() => {
      companyActivityService.implicitCreate(CompanyActions.addBank)(req, {
        object_id: userBank._id
      });
    });
    return res.send(new BaseResponse({ statusCode: 200, data: userBank }));
    // return userBank = await companyBankService
  } catch (error) {
    return next(error);
  }
};

const getCompanyBank = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const companyId = req.company._id;
    const { limit, sort, page, select, ...other } = req.validate;
    const query = { user_id: userId, company_id: companyId, ...other };
    const skip = page ? limit * (page - 1) : 0;
    const response = await companyBankService.find({
      query,
      sort,
      select,
      limit,
      skip
    });
    const total = await companyBankService.count(query);
    const totalPage = Math.ceil(total / limit);

    return res.send(
      new BaseResponse({ statusCode: 200, data: response }).addMeta({ totalPage, total })
    );
  } catch (error) {
    return next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { bank_id, is_default, ...data } = req.validate;
    const userId = req.user.id;
    const companyId = req.company._id;
    const query = { user_id: userId, company_id: companyId, _id: bank_id };
    if (is_default) {
      const oldBank = await companyBankService.findOne({
        query: { user_id: userId, company_id: companyId, is_default: true }
      });
      if (oldBank && oldBank._id.toString() !== bank_id) {
        oldBank.is_default = false;
        oldBank.save();
      }
      data.is_default = true;
    } else if (typeof is_default !== 'undefined') {
      const bank = await companyBankService.findOne({ query });
      if (!bank.is_default) {
        data.is_default = is_default;
      }
    }

    const bank = await companyBankService.findOneAndUpdate({ query, updated: data });
    withSafety(() => {
      companyActivityService.implicitCreate(CompanyActions.updateBankInfo)(req, {
        object_id: bank_id
      });
    });
    return res.send(new BaseResponse({ statusCode: 200, data: bank }));
  } catch (error) {
    return next(error);
  }
};

const adminGet = async (req, res, next) => {
  try {
    const { limit, page, sort, ...query } = req.validate;
    const skip = limit * (page - 1);
    const bankList = await companyBankService.find({ query: query, limit, skip, sort });
    const total = await companyBankService.count(query);
    const totalPage = Math.ceil(total / limit) || 1;
    return res.send(
      new BaseResponse({ statusCode: 200, data: bankList }).addMeta({ totalPage, total })
    );
  } catch (err) {
    return next(err);
  }
};

export default {
  create,
  getCompanyBank,
  update,
  admin: {
    adminGet
  }
};
