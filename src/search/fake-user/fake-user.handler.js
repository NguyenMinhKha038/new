import users from '../../../assets/users.json';
import logger from '../../commons/utils/winston-logger';
import fakeUserModel from './fake-user.model';

export default {
  init: async () => {
    const totalUser = await fakeUserModel.findOne();
    if (!totalUser) {
      logger.info('start import fake user...');
      await fakeUserModel.insertMany(users);
    }
  }
};
