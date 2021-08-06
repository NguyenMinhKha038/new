import mongoose from 'mongoose';

const permissionsSchema = new mongoose.Schema(
  {
    path: {
      type: String,
      required: true,
      unique: true
    },
    description: {
      type: String
      // required : true
    },
    created_by_id: {
      type: mongoose.Types.ObjectId
    }
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

permissionsSchema.virtual('created_by', {
  ref: 'admins',
  localField: 'created_by_id',
  foreignField: '_id',
  justOne: true
});

export default mongoose.model('Permissions', permissionsSchema);
// mongoose.model('Permissions').find({}).then(response => {
//     fs.writeFileSync('./permission.json',JSON.stringify(response));
// });
