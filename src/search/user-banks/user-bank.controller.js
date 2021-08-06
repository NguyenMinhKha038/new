import { BaseError, errorCode, BaseResponse } from '../../commons/utils';
import userBankService from './user-bank.service';

const create = async (req, res, next) => {
  try {
    const { is_default, ...data } = req.validate;
    const bank = await userBankService.findOne({ query: { user_id: req.user.id, ...data } });
    if (bank) {
      return next(
        new BaseError({
          statusCode: 400,
          error: errorCode.client,
          errors: { bank: errorCode['client.global.existed'] }
        }).addMeta({ message: 'bank is existed' })
      );
    }
    const count = await userBankService.count({ user_id: req.user.id });
    const createdData = {
      ...data,
      user_id: req.user.id
    };
    if (!count) {
      createdData.is_default = true;
    } else if (is_default) {
      const oldDefault = await userBankService.findOne({
        query: { user_id: req.user.id, is_default: true }
      });
      if (oldDefault) {
        oldDefault.is_default = false;
        oldDefault.save();
      }
      createdData.is_default = is_default;
    }

    const userBank = await userBankService.create(createdData);
    return res.send(new BaseResponse({ statusCode: 200, data: userBank }));
    // return userBank = await userBankService
  } catch (error) {
    return next(error);
  }
};

const getUserBank = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { select, limit, page, sort, ...query } = req.validate;
    const skip = page ? limit * (page - 1) : 0;
    const response = await userBankService.find({
      query: { user_id: userId, ...query },
      select,
      limit,
      skip
    });

    const total = await userBankService.count({ user_id: userId, ...query });

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
    if (is_default) {
      const oldDefault = await userBankService.findOne({
        query: { user_id: req.user.id, is_default: true }
      });
      if (oldDefault) {
        oldDefault.is_default = false;
        oldDefault.save();
      }
      data.is_default = is_default;
    } else if (typeof is_default !== 'undefined') {
      const bank = await userBankService.findOne({
        query: { user_id: req.user.id, _id: bank_id }
      });
      if (!bank.is_default) {
        data.is_default = is_default;
      }
    }
    const bank = await userBankService.findOneAndUpdate({
      query: { _id: bank_id, user_id: req.user.id },
      updated: { ...data }
    });
    return res.send(new BaseResponse({ statusCode: 200, data: bank }));
  } catch (error) {
    return next(error);
  }
};

const findById = async (req, res, next) => {
  try {
    const { id } = req.validate;
    console.log('ID', id);
    const bank = await userBankService.findOne({ query: { user_id: req.user.id, _id: id } });
    return res.send(new BaseResponse({ statusCode: 200, data: bank }));
  } catch (err) {
    return next(err);
  }
};

export default {
  create,
  getUserBank,
  update,
  findById
};
