import { model, Schema } from 'mongoose';
import { handleXss, removeAccents } from '../../commons/utils/utils';
// import elasticService from '../../commons/elastic/elastic.service';
// import { v7 } from 'mongoose-elasticsearch-xp';

const categorySchema = new Schema(
  {
    name: {
      type: String,
      require: true,
      es_indexed: true,
      es_analyzer: 'vi',
      es_type: 'text'
    },
    pure_name: {
      type: String,
      trim: true
    },
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company'
    },
    type_category_id: {
      type: Schema.Types.ObjectId
    },
    company_category_id: {
      type: Schema.Types.ObjectId
    },
    sub_category_id: {
      type: Schema.Types.ObjectId
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'Users'
    },
    admin_id: {
      type: Schema.Types.ObjectId,
      ref: 'admins'
    },
    image: {
      type: String
    },
    /*
     * 1: danh muc cha
     * 2: danh muc con
     * 3: dong san pham
     * */
    type: {
      type: Number,
      min: 1,
      max: 3,
      default: 3
    },
    status: {
      type: String,
      require: true,
      default: 'pending',
      enum: ['active', 'disabled', 'pending']
    },
    fee_rate: {
      type: Number
    },
    fee_type: {
      type: Number
    },
    parent_id: {
      type: Schema.Types.ObjectId
    },
    priority: {
      type: Number
    },
    has_product: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    es_extend: {
      result_type: {
        es_type: 'text',
        es_value: 'category'
      }
    },
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);
categorySchema.virtual('company_category', {
  ref: 's_category',
  localField: 'company_category_id',
  foreignField: '_id',
  justOne: true
});

categorySchema.virtual('type_category', {
  ref: 's_category',
  localField: 'type_category_id',
  foreignField: '_id',
  justOne: true
});

categorySchema.virtual('sub_category', {
  ref: 's_category',
  localField: 'sub_category_id',
  foreignField: '_id',
  justOne: true
});

categorySchema.index({ pure_name: 'text' });

categorySchema.pre('save', function () {
  if (this.isModified('name')) {
    const n = handleXss(this.name);
    this.name = n;
    this.pure_name = removeAccents(n, true);
  }

  this.type === 3 && (this.sub_category_id = this._id);
  this.type === 2 && (this.company_category_id = this._id);
  this.type === 1 && (this.type_category_id = this._id);
});

const categoryModel = model('s_category', categorySchema);
export default categoryModel;

// elasticService.init({ model: categoryModel });
