import mongoose from 'mongoose';
import { logger } from '../utils';

var options = {
  useNewUrlParser: true,
  autoIndex: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true
};

export default {
  async connect() {
    try {
      const database = await mongoose.connect(process.env.DATABASE_URI, options);
      logger.info('Database Connected');
      return database;
    } catch (error) {
      logger.error('Connect database error %s', process.env.DATABASE_URI);
      logger.error(error);
    }
  }
};
