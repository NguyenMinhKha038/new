import addressModel from './address.model';
import { BaseError, errorCode } from '../../commons/utils';
const addressService = {
  async create(doc) {
    return addressModel.create(doc);
  },
  async find(query, select, options) {
    return addressModel.find(query, select, options);
  },
  async count(query) {
    return addressModel.countDocuments(query);
  },
  async findOne(query, select, options) {
    return addressModel.findOne(query, select, options);
  },
  async findActive(query, select, options) {
    const address = await addressModel.findOne(query, select, options);
    if (!address)
      throw new BaseError({
        statusCode: 200,
        error: errorCode.client,
        errors: {
          address: errorCode['client.addressNotFound']
        }
      });
    return address;
  },
  async update(query, doc) {
    const address = await addressModel.findOne(query);
    if (!address) return null;
    Object.assign(address, doc);
    return address.save();
  },
  async delete(query) {
    return addressModel.findOneAndDelete(query);
  },
  getDefaultAddress() {
    const envDefaultAddressString = process.env.DEFAULT_USER_ADDRESS;
    const [
      defaultAddressString,
      defaultAddressCode,
      defaultAddressCoordinates
    ] = envDefaultAddressString.split('-');
    const userLocation = defaultAddressCoordinates.split(',').reverse();
    const [ward, district, province] = defaultAddressString.split(',');
    const [ward_code, district_code, province_code] = defaultAddressCode.split(',');
    return {
      province,
      district,
      ward,
      province_code,
      district_code,
      ward_code,
      location: {
        coordinates: userLocation
      },
      normalizedAddress: `${ward}, ${district}, ${province}`
    };
  }
};

export default addressService;
