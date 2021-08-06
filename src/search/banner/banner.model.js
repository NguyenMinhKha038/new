import { Schema, model } from 'mongoose';
import configService from '../../commons/config/config.service';

const bannerSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId
    },
    company_id: {
      type: Schema.Types.ObjectId
    },
    name: {
      type: String,
      required: true
    },
    start_time: {
      type: Date,
      required: true
    },
    end_time: {
      type: Date,
      required: true
    },
    image: { type: String, trim: true },
    position: {
      type: Number,
      enum: [1, 2, 3, 4, 5]
    },
    fee: {
      type: Number
    },
    total_fee: {
      type: Number
    },
    _fee: {
      type: Number
    },
    _total_fee: {
      type: Number
    },
    is_paid: {
      type: Boolean,
      default: false
    },
    is_active_company: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['approved', 'pending', 'rejected', 'disabled'],
      default: 'pending'
    },
    is_admin_posted: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

bannerSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

bannerSchema.method('getFee', async function (bannerConfig) {
  if (!bannerConfig) bannerConfig = await configService.get('banner');
  const fee = bannerConfig.banner_fee.find((fee) => fee.position === this.position).fee;
  const differentHours = (new Date(this.end_time) - new Date(this.start_time)) / 36e5;
  this._fee = fee;
  this._total_fee = Math.round(differentHours * fee);
});

bannerSchema.virtual('isActive').get(function () {
  return this.end_time > Date.now() && this.start_time < Date.now();
});

export default model('s_banner', bannerSchema);
