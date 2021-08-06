import { Schema, model } from 'mongoose';
import statisticService from '../statistic/statistic.service';
import { handleXss } from '../../commons/utils/utils';
import reportConfig from './report.config';

const reportSchema = new Schema(
  {
    email: {
      type: String,
      required: true
    },
    language: {
      type: String,
      enum: reportConfig.supportedLanguages,
      default: 'vi'
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    reporter_type: {
      type: String,
      enum: Object.keys(reportConfig.types),
      default: 'user'
    },
    type: {
      type: String,
      default: 'general'
    },
    content: {
      type: String,
      trim: true,
      minlength: reportConfig.contentLengths.min,
      maxlength: reportConfig.contentLengths.max
    },
    images: [String],
    response: {
      type: String
    },
    status: {
      type: String,
      enum: reportConfig.statuses,
      default: 'pending'
    },
    admin_id: {
      type: Schema.Types.ObjectId,
      ref: 'admins'
    },
    hidden_reason: {
      type: String
    }
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

reportSchema.virtual('user', {
  ref: 'Users',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

reportSchema.virtual('admin', {
  ref: 'admins',
  localField: 'admin_id',
  foreignField: '_id',
  justOne: true
});

reportSchema.pre('save', function () {
  if (this.isModified('content')) {
    this.content = handleXss(this.content);
  }
  if (this.isNew) {
    statisticService.update({ total_report: 1 });
  }
});

reportSchema.pre('findOneAndUpdate', function () {
  const response = this._update.response;
  if (response) {
    this._update.response = handleXss(response);
  }
});

const reportModel = model('s_report', reportSchema);

export default reportModel;
