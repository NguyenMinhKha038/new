import { Types } from 'mongoose';
/**
 *
 * @description implement Mongodb ObjectId to String prototype
 */
export default String.prototype.toObjectId = function () {
  return new Types.ObjectId(this.toString());
};
