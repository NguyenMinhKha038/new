import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const permissionGroupsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    permission_ids: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Permissions'
      }
    ],
    description: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('admin_permission_groups', permissionGroupsSchema);
