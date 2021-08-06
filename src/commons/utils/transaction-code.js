import { randomInt } from './utils';

/**
 *
 * @param {string} prefixString prefix string of code
 * @param {string} prePrefix prefix of prefix string, use for some transaction what in the same model and need to detect type
 */
export function getTransactionCode(prefixString, prePrefix) {
  // if (prefixString.indexOf('+84') >= 0) {
  //   prefixString = prefixString.replace(/\+84/, '');
  // }
  const code = new Date().getTime().toString(36).toUpperCase();
  const suffix = randomInt(1000);

  let response = code + suffix;
  if (prefixString) {
    response = prefixString + '-' + response;
  }
  if (prePrefix) response = prePrefix + '-' + response;
  return response;
}
