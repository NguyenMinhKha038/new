import { Schema, model } from 'mongoose';

const configSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  value: {
    type: Schema.Types.Mixed,
    required: true
  },
  fee: {
    type: Number
  },
  min: { type: Number },
  max_per_day: { type: Number },
  version: { type: Number, default: 1 }
});

export default model('configs', configSchema);
