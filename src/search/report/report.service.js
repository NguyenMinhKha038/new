import { findAdvanced } from '../../commons/utils';
import reportModel from './report.model';

const reportService = {
  find({ limit, page, select, sort, populate, query }) {
    return findAdvanced(reportModel, { query, select, limit, page, sort, populate });
  },
  findOne(query, select, options) {
    return reportModel.findOne(query, select, options);
  },
  create(doc) {
    return reportModel.create(doc);
  },
  update(query, update) {
    return reportModel.findOneAndUpdate(query, update, {
      new: true,
      runValidators: true
    });
  },
  count(query) {
    return reportModel.countDocuments(query);
  }
};

export default reportService;
