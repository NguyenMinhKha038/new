import { startSession, Document, ClientSession } from 'mongoose';
import { Promise } from 'bluebird';
import logger from './winston-logger';

/**
 * session callback.
 *
 * @callback sessionCallback
 * @param {ClientSession} session
 * @returns {Promise<any>}
 */

/**
 *
 * input a callback and exec it with session
 *
 * @param {sessionCallback} callback
 * @returns {Promise<any>}
 */
export const withSession = async (callback) => {
  const session = await startSession();
  let data;
  try {
    await session.withTransaction(async () => {
      data = await callback(session);
    });
    session.endSession();
  } catch (err) {
    session.endSession();
    throw err;
  }
  return data;
};

/**
 *
 * map an array of function and return `Document[]`
 *
 * @param {...sessionCallback} actions
 * @returns {Promise<Document>[]}
 * @deprecated use `withSession` instead
 */
export const transact = async (...actions) => {
  const session = await startSession();
  session.startTransaction();
  let transactions;
  try {
    transactions = await mapTransaction(...actions)(session);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
  await session.commitTransaction();
  session.endSession();
  return transactions;
};

/**
 *
 *
 * @param {...Function} actions
 * @returns {function(ClientSession): Promise<Document>}
 */
export const mapTransaction = (...actions) => async (session) => {
  return await Promise.map(actions, (action) => action && action(session));
};

/**
 * exec function without error
 *
 * @param {Function} callback
 * @returns {any}
 */
export const withSafety = async (callback) => {
  try {
    return await callback();
  } catch (error) {
    logger.error(error);
  }
};

export default { withSession, transact, mapTransaction, withSafety };
