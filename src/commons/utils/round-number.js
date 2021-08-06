/**
 *
 *
 * @param {number} number
 * @param {number} [digit=0]
 * @returns {number}
 */
const roundNumber = (number, digit = 0) => {
  const frag = 10 ** digit;
  return Math.round(number * frag) / frag;
};

export default roundNumber;
