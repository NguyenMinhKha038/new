import { Promise } from 'bluebird';
import { BaseError, errorCode } from '../../../commons/utils';
import { AccompaniedProductStatuses } from '../../product-storing/v2/product-storing.config';
import productStoringService from '../../product-storing/v2/product-storing.service';
import orderHandler from '../order.handler';

export default {
  ...orderHandler
};
