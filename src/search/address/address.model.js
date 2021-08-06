import { model, Schema } from 'mongoose';
import { searchService } from '../search/search.service';

const addressSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      index: true
    },
    is_default: {
      type: Boolean,
      default: false
    },
    province_code: {
      type: String
    },
    province: {
      type: String,
      required: true
    },
    district: {
      type: String,
      required: true
    },
    district_code: {
      type: String
    },
    ward: {
      type: String,
      required: true
    },
    ward_code: {
      type: String
    },
    text: {
      type: String,
      required: true
    },
    receiver: {
      type: String,
      required: true
    },
    phone_number: {
      type: String,
      required: true
    },
    location: {
      type: { type: String },
      coordinates: {
        type: []
      },
      default: {}
    }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

addressSchema.virtual('normalizedAddress').get(function () {
  return `${this.text}, ${this.ward}, ${this.district}, ${this.province}`;
});
addressSchema.pre('save', async function () {
  if ((this.isNew && this.is_default) || (!this.isNew && this.isModified('is_default'))) {
    await addressModel
      .findOneAndUpdate(
        { user_id: this.user_id, is_default: this.is_default },
        { is_default: !this.is_default }
      )
      .exec();
  }
  if (
    this.modifiedPaths().some((prop) => ['province', 'district', 'ward', 'text'].includes(prop))
  ) {
    const location = {
      type: 'Point',
      coordinates: await searchService.getCoordinates(this.normalizedAddress)
    };
    this.location = location;
  }
});
const addressModel = model('s_address', addressSchema);
export default addressModel;
