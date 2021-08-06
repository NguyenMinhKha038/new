import addressService from './address.service';
import { BaseResponse } from '../../commons/utils';

const addressController = {
  async get(req, res, next) {
    try {
      const { id: user_id } = req.user;
      const addresses = await addressService.find({ user_id });
      return new BaseResponse({ statusCode: 200, data: addresses }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async post(req, res, next) {
    try {
      const { id: user_id } = req.user;
      const newAddress = req.body;
      const address = await addressService.create({ user_id, ...newAddress });
      addressService.count({ user_id }).then((count) => {
        if (count === 1) {
          address.is_default = true;
          address.save();
        }
      });
      return new BaseResponse({ statusCode: 200, data: address }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async put(req, res, next) {
    try {
      const { id: user_id } = req.user;
      const updateAddress = req.body;
      const { id: _id } = req.params;
      const address = await addressService.update({ user_id, _id }, updateAddress);
      return new BaseResponse({ statusCode: 200, data: address }).return(res);
    } catch (error) {
      next(error);
    }
  },
  async delete(req, res, next) {
    try {
      const { id: user_id } = req.user;
      const { id: _id } = req.params;
      const address = await addressService.findOne({ user_id, _id });
      if (!address) return new BaseResponse({ statusCode: 200, data: null }).return(res);
      if (address.is_default) await addressService.update({ user_id }, { is_default: true });
      await address.remove();
      return new BaseResponse({ statusCode: 200, data: {} }).return(res);
    } catch (error) {
      next(error);
    }
  }
};
export default addressController;
