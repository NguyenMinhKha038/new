import billModel from './bill.model';
import { findAdvanced, BaseError, errorCode } from '../../commons/utils';
import { configService } from '../../commons/config';
import billingGateway from '../billing-gateway';

export default {
  create: (doc, { session } = {}) => {
    return new billModel(doc).save({ session });
  },
  async update(query, updates, options) {
    return billModel.findOneAndUpdate(query, updates, options);
  },
  async find({ limit, page, populate, select, sort, ...query }) {
    return findAdvanced(billModel, { limit, page, populate, select, sort, ...query });
  },
  async findOne(query, select, options) {
    return billModel.findOne(query, select, options);
  },
  async count(query) {
    return billModel.countDocuments(query);
  },
  async checkout({ service_code, publisher, customer_code }) {
    const config = await configService.get(service_code.toLowerCase());
    let payment_fee = config.payment_fee || 0;
    const selectedPublisher = config.publishers.find((_publisher) => _publisher.name === publisher);
    if (!selectedPublisher || !selectedPublisher.is_active) {
      throw new BaseError({
        statusCode: 403,
        error: errorCode.client,
        errors: { publisher: errorCode['client.billPublisherNotActive'] }
      });
    }
    payment_fee += selectedPublisher.payment_fee || 0;
    const mc_request_id = billingGateway.vimo.generateRequestId();
    const bills = await billingGateway.vimo.queryBill({
      customer_code,
      publisher,
      service_code,
      mc_request_id
    });
    bills.billDetail &&
      (bills.original_total = bills.billDetail.reduce((prev, curt) => prev + curt.amount, 0));
    bills.total = bills.original_total + payment_fee;
    bills.payment_fee = payment_fee;
    return { bills, selectedPublisher };
  }
};
