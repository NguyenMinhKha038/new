import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const permissionSchema = new Schema(
  {
    path_list: [
      {
        type: String,
        required: true
        // unique: true
      }
    ],
    // path: { type: String },
    method: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    type: {
      type: String,
      required: true
    }
  },
  {
    timestamp: true
  }
);

export default mongoose.model('s_permissions', permissionSchema);
