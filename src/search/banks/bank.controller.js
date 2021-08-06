import BaseResponse from '../../commons/utils/base-response';
import bankService from './bank.service';

async function getBankList(req, res, next) {
  try {
    // const { province_id } = req.validate;
    const bankList = bankService.getBankList();
    return new BaseResponse({ statusCode: 200, data: bankList }).return(res);
  } catch (error) {
    return next(error);
  }
}

async function getProvinceList(req, res, next) {
  try {
    const { bank_id } = req.validate;
    const provinceList = bankService.getProvinceByBankId(bank_id);
    return new BaseResponse({ statusCode: 200, data: provinceList }).return(res);
  } catch (error) {
    return next(error);
  }
}

async function getDistrictList(req, res, next) {
  try {
    const { bank_id, province_id } = req.validate;
    const districtList = bankService.getDistrict(bank_id, province_id);
    return new BaseResponse({ statusCode: 200, data: districtList }).return(res);
  } catch (error) {
    return next(error);
  }
}

async function getBranchList(req, res, next) {
  try {
    const { bank_id, province_id, district_id } = req.validate;
    const branchList = bankService.getBankBranch(bank_id, province_id, district_id);
    return new BaseResponse({ statusCode: 200, data: branchList }).return(res);
  } catch (error) {
    return next(error);
  }
}

export default {
  getBankList,
  getProvinceList,
  getDistrictList,
  getBranchList
};
