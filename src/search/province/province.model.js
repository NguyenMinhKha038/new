import { Schema, model } from 'mongoose';

const provinceSchema = new Schema({
  code: {
    type: String,
    required: true,
    index: true
  },
  parent_code: {
    type: String
  },
  type: {
    type: Number,
    enum: [1, 2, 3]
  },
  name: {
    type: String,
    required: true
  }
});

const provinceModel = model('s_province', provinceSchema);
export default provinceModel;
