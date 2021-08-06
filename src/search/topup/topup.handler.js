import moment from 'moment';
import billingGateway from '../billing-gateway';
import topupService from './topup.service';

export default {
  topup: {
    handleTopUp
  },
  combo: {
    /**
     *
     *
     * @param {TopUpCombo&MongooseDocument} combo
     * @returns {Promise<TopUpCombo&MongooseDocument>}
     */
    async handleTopUp({ combo }, options = {}) {
      const { session } = options;
      if (!session) throw new Error('session is required');
      if (combo.status === 'completed') return;
      const topup = await topupService['topup'].create(
        {
          amount: combo.amount,
          combo_id: combo._id,
          combo: combo.combo,
          in_combo: true,
          months: combo.months,
          month: combo.months - combo.remain_months + 1,
          publisher: combo.publisher,
          receiver: combo.receiver,
          status: 'pending',
          total: combo.amount,
          type: combo.type,
          user_id: combo.user_id
        },
        { session }
      );
      await handleTopUp({ topup }, { session });
      combo.status = 'handling';
      combo.remain_months--;
      if (combo.remain_months === 0) combo.status = 'completed';
      combo.next_date = moment().startOf('d').add(30, 'd').toDate();
      await combo.save();
      return combo;
    }
  }
};

/**
 *
 *
 * @param {TopUp&MongooseDocument} topup
 * @returns {Promise<TopUp&MongooseDocument>}
 */
async function handleTopUp({ topup }, { session }) {
  if (!session) throw new Error('session is required');
  console.log(`===>: handleTopUp -> topup`, topup);
  if (topup.status === 'success') return;
  topup.code = billingGateway.vimo.generateRequestId();
  const type = topup.type === 'fast' ? 'vimo' : 'tplink';
  const _bill = await billingGateway[type].topup({
    amount: topup.amount,
    receiver: topup.receiver,
    transaction_id: topup.code
  });
  const external_transaction_id = _bill.transaction_id;
  topup.external_transaction_id = external_transaction_id;
  topup.status = 'success';
  await topup.save();
  return topup;
}
