import transactionCountModel from './transaction-count.model';
import { getDate, mergeObject } from '../../commons/utils';

async function find({ query, options, limit, skip, sort }) {
  return await transactionCountModel.find(query, options).limit(limit).skip(skip).sort(sort);
}

async function findOne(query, options) {
  return await transactionCountModel.findOne(query, options);
}

async function update(
  query,
  update = {
    withdraw: 0,
    transfer: 0
  },
  options
) {
  return await transactionCountModel.findOneAndUpdate(
    { ...query, date: getDate() },
    { $inc: mergeObject({}, update) },
    { new: true, upsert: true, setDefaultsOnInsert: true, ...options }
  );
}

export default {
  find,
  update,
  findOne
};
