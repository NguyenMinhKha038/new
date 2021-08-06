import { Schema, model } from 'mongoose';

const fakeUserSchema = new Schema({
  name: {
    type: String,
    unique: true
  },
  phone_number: {
    type: String,
    unique: true
  },
  phone_telecom: {
    type: String
  },
  gender: {
    type: String,
    enum: ['male', 'female']
  },
  is_used: { type: Boolean, default: false }
});

export default model('s_g_user', fakeUserSchema);
