import bankBranch from '../../../assets/bank-branch.json';
import bankList from '../../../assets/bankList.json';

const getBankList = () => {
  return bankList;
};

const getProvinceByBankId = (bank_id) => {
  if (!bank_id) {
    return [];
  }
  const bank = bankBranch[bank_id];
  if (!bank) {
    return [];
  }
  const branchInfo = bank.branch_info;
  if (!branchInfo) {
    return [];
  }
  const provinces = [];
  for (const provinceId in branchInfo) {
    const province = {
      id: provinceId,
      name: branchInfo[provinceId].province_name
    };
    provinces.push(province);
  }
  return provinces;
};

const getDistrict = (bank_id, province_id) => {
  if (!bank_id || !province_id) {
    return [];
  }
  const bank = bankBranch[bank_id];
  if (!bank) {
    return [];
  }
  const branchInfo = bank.branch_info;
  if (!branchInfo) {
    return [];
  }
  const province = branchInfo[province_id];
  if (!province) {
    return [];
  }
  const districts = province.districts;
  if (!districts) {
    return [];
  }
  const districtList = [];
  for (const districtId in districts) {
    const district = {
      id: districtId,
      name: districts[districtId].district_name
    };
    districtList.push(district);
  }
  return districtList;
};

const getBankBranch = (bank_id, province_id, district_id) => {
  if (!bank_id || !province_id || !district_id) {
    return [];
  }
  const bank = bankBranch[bank_id];
  if (!bank) {
    return [];
  }
  const branchInfo = bank.branch_info;
  if (!branchInfo) {
    return [];
  }
  const province = branchInfo[province_id];
  if (!province) {
    return [];
  }
  const districts = province.districts;
  if (!districts) {
    return [];
  }
  const bankBranchList = districts[district_id];
  return bankBranchList;
};

export default {
  getBankList,
  getProvinceByBankId,
  getDistrict,
  getBankBranch
};
