import { logger } from '../../commons/utils';

export class Tplink {
  constructor(config) {}
  async topup({ transaction_id, receiver, amount }) {
    logger.info('Slow_topup %o', { transaction_id, receiver, amount });
    return { transaction_id: 'TESTTEST' };
  }
}
