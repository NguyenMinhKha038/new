import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const adminsSchema = new mongoose.Schema(
  {
    user_name: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
      // select: false
    },
    token: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'disabled']
    },
    permission_group_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'admin_permission_groups'
    }
  },
  {
    timestamps: true
  }
);

//hashing a password before saving it to the database
adminsSchema.pre('save', function (next) {
  var admin = this;
  if (this.isModified('password') || this.isNew)
    bcrypt.hash(admin.password, 10, function (err, hash) {
      if (err) {
        return next(err);
      }
      admin.password = hash;
      next();
    });
  else next();
});

var admins = mongoose.model('admins', adminsSchema);
module.exports = admins;
export default admins;
