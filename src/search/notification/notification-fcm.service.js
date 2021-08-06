import { logger } from '../../commons/utils/index.js';
import { firebaseInted } from '../../commons/auth/auth.service.js';

export default {
  sendMessage(message = { tokens: '', notification: { body: '', title: '' }, data: {} }) {
    logger.info('send messages %o', message);
    firebaseInted
      .messaging()
      .sendMulticast(message)
      .then((response) => {
        console.log(response);
        if (response.failureCount > 0) {
          const failedTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(message.tokens[idx]);
            }
          });
          logger.error('List of tokens that caused failures: ' + failedTokens);
        }
      });
  }
};
