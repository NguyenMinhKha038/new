import { Schema, model } from 'mongoose';
import elasticService from '../../commons/elastic/elastic.service';
import { v7 } from 'mongoose-elasticsearch-xp';
import statisticService from '../statistic/statistic.service';
import { removeAccents, handleXss } from '../../commons/utils/utils';

const storeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      es_indexed: true,
      unique: true,
      es_type: 'text',
      es_analyzer: 'vi'
    },
    pure_name: {
      type: String,
      trim: true
    },
    description: { type: String, trim: true },
    logo: { type: String, trim: true },
    cover_image: { type: String, trim: true },
    address: {
      type: {
        province: String,
        district: String,
        ward: String,
        text: String,
        province_code: String,
        district_code: String,
        ward_code: String,
        phone_number: String,
        manager_name: String
      },
      required: true,
      es_type: {
        province: {
          es_type: 'text',
          es_analyzer: 'vi'
        },
        district: {
          es_type: 'text',
          es_analyzer: 'vi'
        },
        ward: {
          es_type: 'text',
          es_analyzer: 'vi'
        },
        province_code: {
          es_type: 'text'
        },
        district_code: {
          es_type: 'text'
        },
        ward_code: {
          es_type: 'text'
        },
        text: {
          es_type: 'text',
          es_analyzer: 'vi'
        }
      },
      es_indexed: true
    },
    company_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 's_company',
      index: true,
      es_indexed: true,
      es_type: {
        _id: {
          es_type: 'keyword'
        },
        name: {
          es_type: 'text',
          es_analyzer: 'vi'
        },
        images: { es_type: 'text' },
        logo: { es_type: 'text' },
        cover_image: { es_type: 'text' },
        status: { es_type: 'text' },
        max_refund: { es_type: 'float' },
        max_discount: { es_type: 'float' }
      }
    },
    type_category_id: {
      type: Schema.Types.ObjectId,
      ref: 's_category',
      es_indexed: true,
      es_type: {
        _id: {
          es_type: 'text'
        },
        name: {
          es_type: 'text',
          es_analyzer: 'vi'
        }
      }
    },
    company_category_id: {
      type: Schema.Types.ObjectId,
      ref: 's_category',
      es_indexed: true,
      es_type: {
        _id: {
          es_type: 'text'
        },
        name: {
          es_type: 'text',
          es_analyzer: 'vi'
        }
      }
    },
    user_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    location: {
      type: { type: String },
      coordinates: {
        type: []
      }
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active'
    },
    is_active_company: {
      type: Boolean,
      default: false
    },
    total_order: {
      type: Number,
      default: 0,
      select: false
    },
    total_pay: {
      type: Number,
      default: 0,
      select: false
    },
    total_refund: {
      type: Number,
      default: 0,
      select: false
    },
    total_discount: {
      type: Number,
      default: 0,
      select: false
    },
    max_refund: {
      type: Number,
      default: 0,
      es_indexed: true
    },
    max_discount: {
      type: Number,
      default: 0,
      es_indexed: true
    },
    max_discount_rate: {
      type: Number,
      default: 0,
      es_indexed: true,
      es_type: 'float'
    },
    max_refund_rate: {
      type: Number,
      default: 0,
      es_indexed: true,
      es_type: 'float'
    },
    total_staff: {
      type: Number,
      default: 0,
      select: false
    },
    total_revenue: {
      type: Number,
      default: 0,
      select: false
    },
    total_product: {
      type: Number,
      default: 0
    },
    active_product: {
      type: Number,
      default: 0
    },
    distance: Number,
    is_lucky: Boolean,
    ghn_shop_id: Number
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    es_extend: {
      result_type: {
        es_type: 'text',
        es_value: 'store'
      },
      coordinates: {
        es_type: 'geo_point',
        es_value: function (doc) {
          return doc.location.coordinates;
        }
      },
      true_max_refund: {
        es_type: 'long',
        es_value: function (doc) {
          return Math.round((doc.max_refund * 9) / 10);
        }
      },
      showable: {
        es_type: 'boolean',
        es_value: function (doc) {
          return doc.is_active_company && doc.status === 'active';
        }
      }
    }
  }
);

storeSchema.index({ location: '2dsphere' });
storeSchema.index({ pure_name: 'text' });

storeSchema.virtual('company', {
  ref: 's_company',
  localField: 'company_id',
  foreignField: '_id',
  justOne: true
});

storeSchema.virtual('normalizedAddress').get(function () {
  return (
    this.address &&
    `${this.address.text}, ${this.address.ward}, ${this.address.district}, ${this.address.province}`
  );
});

storeSchema.plugin(v7, {
  client: elasticService.client,
  onlyOnDemandIndexing: true
});

storeSchema.pre('save', function () {
  if (this.isModified('name')) {
    const n = handleXss(this.name);
    this.name = n;
    this.pure_name = removeAccents(n, true);
  }

  if (this.isNew) {
    statisticService.update({ total_store: 1 });
  }
});

const storeModel = model('s_store', storeSchema);
export default storeModel;

export const storeOptions = {
  model: storeModel,
  query: {},
  populate: [
    { path: 'company_category_id', select: 'name' },
    { path: 'type_category_id', select: 'name' },
    {
      path: 'company_id',
      select: 'name status max_refund max_discount images logo cover_image'
    }
  ]
};

elasticService.init(storeOptions);
