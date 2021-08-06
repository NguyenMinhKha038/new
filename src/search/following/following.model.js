import { Schema, model } from 'mongoose';

const followingSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 's_company'
    }
  },
  { timestamps: true }
);

export default model('s_following', followingSchema);
