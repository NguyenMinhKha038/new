import provinceList from '../../../assets/provinces';
import districtList from '../../../assets/districts';
import { Schema, model } from 'mongoose';
import { Types } from './behavior.config';
import { removeAccents } from '../../commons/utils/utils';

const behaviorSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, required: true },
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company'
    },
    store_id: {
      type: Schema.Types.ObjectId,
      ref: 's_store'
    },
    type_category_id: {
      type: Schema.Types.ObjectId,
      ref: 's_category'
    },
    company_category_id: {
      type: Schema.Types.ObjectId,
      ref: 's_category'
    },
    sub_category_id: {
      type: Schema.Types.ObjectId,
      ref: 's_category'
    },
    product_id: { type: Schema.Types.ObjectId, ref: 's_product' },
    order_id: { type: Schema.Types.ObjectId, ref: 's_order' },
    canceled_by: { type: String, enum: ['user', 'company'] },
    reason_canceled: { type: String },
    reason_rejected: { type: String },
    parent_type: { type: String },
    type: { type: String },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
      _address: { type: String },
      province: { type: String },
      _province: { type: String },
      province_code: { type: String },
      district: { type: String },
      _district: { type: String },
      district_code: { type: String },
      ward: { type: String },
      _ward: { type: String },
      ward_code: { type: String },
      country: { type: String },
      _country: { type: String },
      country_code: { type: String },
      text: { type: String },
      _text: { type: String },
      raw_address: { type: String },
      _raw_address: { type: String }
    },
    on_model: { type: String },
    reaction_id: { type: Schema.Types.ObjectId }
  },
  { timestamps: true }
);

behaviorSchema.pre('save', function () {
  // Map parent_type if type is modified
  if (this.isModified('type')) {
    const type = this.type;
    for (const [key, val] of Object.entries(Types)) {
      if (Object.values(val).includes(type)) {
        this.parent_type = key;
        break;
      }
    }
  }

  // Map non-accents fields
  if (this.location && this.isModified('location')) {
    const fields = ['address', 'province', 'district', 'ward', 'country', 'text'];
    for (const field of fields) {
      if (this.location[field]) {
        this.location['_' + field] = removeAccents(this.location[field]);
      }
    }

    // Map province_code if not yet
    const { province_code, _province, _district, district_code } = this.location;
    if (_provine && !province_code) {
      const provinceInfo = provinceList.find((province) => {
        const name = removeAccents(province.name);
        return _province.search(new RegExp(name, 'gi')) > -1;
      });
      provinceInfo && (this.location.province_code = provinceInfo.code);
    }
    // Map district_code if not yet
    if (_district && !district_code) {
      const districtInfo = districtList.find((district) => {
        const name = removeAccents(district.name);
        return _district.search(new RegExp(name, 'gi')) > -1;
      });
      districtInfo && (this.location.district_code = districtInfo.code);
    }
  }
});

export default model('s_behavior', behaviorSchema);
