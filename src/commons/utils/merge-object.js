/**
 *
 *  @description validate properties of ...source and merge them to target object
 * @param {Object} target
 * @param {Object} source
 * @returns merged object
 */
const mergeObject = (target, ...source) => {
  let data = {};
  Object.assign(data, ...source);
  for (const iterator in data) {
    if (
      typeof data[iterator] !== 'boolean' &&
      typeof data[iterator] !== 'number' &&
      !data[iterator]
    )
      continue;
    Object.assign(target, { [iterator]: data[iterator] });
  }
  return target;
};
export default mergeObject;
