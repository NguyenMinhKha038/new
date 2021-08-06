import provinceList from '../../../assets/provinces';
import districtList from '../../../assets/districts';
import wardList from '../../../assets/wards';

const provinceService = {
  async find({ type, parent_code }) {
    switch (+type) {
      case 1:
        return provinceList;
      case 2:
        return districtList.filter((doc) => doc.parent_code === parent_code);
      case 3:
        return wardList.filter((doc) => doc.parent_code === parent_code);
    }
  }
};

export default provinceService;
