/**
 * @param {number} value number to format
 * @param {string} localeString locale to format
 * @param {string} suffixString currency to format
 * @returns {string}
 */
export function currencyFormat(value, localeString = 'vi-VN', suffixString = 'đồng') {
  if (typeof value !== 'number') {
    throw new Error('value must be a number');
  }
  return value.toLocaleString(localeString) + ' ' + suffixString;
}

export default currencyFormat;
