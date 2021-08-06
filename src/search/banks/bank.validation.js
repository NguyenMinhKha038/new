import Joi from '@hapi/joi';
const getProvinceList = Joi.object()
  .keys({
    bank_id: Joi.string().required()
  })
  .unknown(false);

const getDistrictList = Joi.object()
  .keys({
    bank_id: Joi.string().required(),
    province_id: Joi.string().required()
  })
  .unknown(false);

const getBranchList = Joi.object()
  .keys({
    bank_id: Joi.string().required(),
    province_id: Joi.string().required(),
    district_id: Joi.string().required()
  })
  .unknown(false);

export default {
  getProvinceList,
  getDistrictList,
  getBranchList
};
