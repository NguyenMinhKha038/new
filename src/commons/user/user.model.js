import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import statisticService from '../../search/statistic/statistic.service';
import userService from './user.service';
import { handleXss, removeAccents } from '../utils/utils';

const walletSchema = new mongoose.Schema({
  refund: {
    type: Number,
    default: 0
  },
  deposit: {
    type: Number,
    default: 0
  },
  withdrawal: {
    type: Number,
    default: 0
  },
  commission: {
    type: Number,
    default: 0
  },
  fee: {
    type: Number,
    default: 0
  },
  transfer: {
    type: Number,
    default: 0
  },
  receive: {
    type: Number,
    default: 0
  },
  bonus_available: {
    type: Number,
    default: 0
  },
  s_prepaid: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0
  }
});

const usersSchema = new mongoose.Schema(
  {
    email: {
      type: String
    },
    password: {
      type: String
    },
    name: {
      type: String,
      required: true
    },
    pure_name: {
      type: String,
      trim: true
    },
    fb_id: {
      type: String
    },
    user_type: {
      type: String,
      default: 'user',
      enum: ['user', 'buyer']
    },
    login_type: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      index: true
    },
    ref_code: {
      type: String
    },
    ref_id: {
      type: Schema.Types.ObjectId,
      // type: String,
      ref: 'Users'
    },
    last_active_time: {
      type: Number
    },
    point: { type: Number, default: 0 },
    ref_point: { type: Number, default: 0 },
    passport_number: String,
    passport_image: [
      {
        name: String,
        path: String,
        status: String
      }
    ],
    PIN: {
      type: String
    },
    active_pin: {
      type: Boolean,
      default: false
    },
    real_name: {
      type: String
    },
    passport_type: {
      type: String,
      enum: ['national_identity_card', 'driving_license', 'passport']
    },
    address: {
      type: String
    },
    selfy_image: {
      path: String,
      status: String
    },
    avatar: String,
    about_me: String,
    status: {
      type: String,
      required: true,
      enum: ['non-kyc', 'approve-kyc', 'reject-kyc', 'pending-kyc', 'disabled']
    },
    birthday: String,
    gender: String,
    fb_friend: [
      {
        fb_id: String,
        name: String
      }
    ],
    token: {
      type: String
    },
    verify: {
      type: Boolean,
      default: false
    },
    phone_verify: {
      type: Boolean,
      default: false
    },
    mail_verify: {
      type: Boolean,
      default: false
    },
    wallet: {
      type: walletSchema,
      default: {}
    },
    level: {
      type: Number,
      default: 0
    },
    addresses: [{ type: String }],
    passport_provide_date: {
      type: Date
    },
    passport_provide_location: {
      type: String
    },
    bank: {
      type: String
    },
    bank_account_number: {
      type: String
    },
    bank_branch: {
      type: String
    },
    user_bank_name: {
      type: String
    },
    device_token: {
      type: {
        mobile: String,
        web: String
      },
      default: {
        mobile: '',
        web: ''
      },
      select: false
    },
    verify_code: {
      type: String,
      default: null
    },
    verify_expired: {
      type: Date
    },
    wrong_verify_times: {
      type: Number,
      select: false,
      default: 0
    },
    chat_password: {
      type: String
    },
    chat_username: {
      type: String
    },
    is_lucky: Boolean,
    user_version: {
      type: Number,
      default: 0,
      select: false
    }
  },

  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

usersSchema.index({ pure_name: 'text' });

usersSchema.virtual('staff_info', {
  ref: 's_permission_group',
  localField: '_id',
  foreignField: 'user_id',
  justOne: true
});
// usersSchema.virtual('toObject', { virtuals: true });
// usersSchema.virtual('toJSON', { virtuals: true });
//hashing a password before saving it to the database
usersSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    const n = handleXss(this.name);
    this.name = n;
    this.pure_name = removeAccents(n, true);
  }

  var user = this;
  if (this.isModified('password') || this.isNew) {
    // statistic
    if (this.isNew) {
      statisticService.update({ total_user: 1 });
    }
    if (!user.password) return next();
    bcrypt.hash(user.password, 10, function (err, hash) {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  } else return next();
});

usersSchema.method('removeSensitive', function () {
  delete this.password;
  delete this.PIN;
  // const { password, PIN, ...other } = this;
  // console.log('this', this);
  // return other;
});

// usersSchema.methods.get

export default mongoose.model('Users', usersSchema);

export const omitSensitiveUserData = (user) => {
  if (!user) {
    return null;
  }
  const {
    password,
    chat_username,
    chat_password,
    verify_code,
    wrong_verify_times,
    verify_expired,
    token,
    ...other
  } = user;
  return other;
};
