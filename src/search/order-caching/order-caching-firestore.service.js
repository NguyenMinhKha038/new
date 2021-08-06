import { firebaseInted } from '../../commons/auth/auth.service';
import { mergeObject } from '../../commons/utils';

const db = firebaseInted.firestore();

const orderCachingCollection = db.collection('s_order_caching');

export default {
  /**
   *
   *
   * @param {*} code
   * @param {{ status, progress_status, user_id, user_avatar, user_name, user_wallet, user_phone_number }} doc
   * @returns
   */
  create(code, doc) {
    return orderCachingCollection.doc(code).create(mergeObject({}, { ...doc, timestamp: new Date() }));
  },
  /**
   *
   *
   * @param {*} code
   * @param {{ status, progress_status, user_id, user_avatar, user_name, user_wallet, user_phone_number }} updates
   * @returns
   */
  update(code, updates) {
    return orderCachingCollection.doc(code).update(mergeObject({}, updates));
  },
  get(code) {
    return orderCachingCollection.doc(code).get();
  }
};
