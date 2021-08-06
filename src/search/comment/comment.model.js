import { Schema, model } from 'mongoose';
import statisticService from '../statistic/statistic.service';
import { handleXss } from '../../commons/utils/utils';

const commentsSchema = new Schema(
  {
    parent_comment_id: {
      type: Schema.Types.ObjectId,
      ref: 's_comment'
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users',
      required: true
    },
    user_name: {
      type: String,
      required: true
    },
    user_avatar: {
      type: String
    },
    product_id: {
      type: Schema.Types.ObjectId,
      ref: 'product',
      required: true,
      index: true
    },
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company',
      required: true
    },
    type: {
      type: String,
      enum: ['comment', 'reply'],
      default: 'comment',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    images: {
      type: [String]
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'rejected', 'approved', 'deleted'],
      default: 'pending'
    },
    replies_count: {
      type: Number,
      default: 0
    },
    commenter_type: {
      type: String,
      enum: ['user', 'company'],
      default: 'user'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

commentsSchema.virtual('replies', {
  ref: 's_comment',
  localField: '_id',
  foreignField: 'parent_comment_id'
});

commentsSchema.pre('save', function () {
  this.content = handleXss(this.content);
  if (this.isNew) statisticService.update({ total_comment: 1 });
});

export default model('s_comment', commentsSchema);
