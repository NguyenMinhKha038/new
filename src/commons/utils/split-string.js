/**
 *
 *
 * @param {string} string
 * @returns {string[]} Array of splited string
 */
const splitString = (string) => string && string.split(',').map((item) => item.trim());

export default splitString;
