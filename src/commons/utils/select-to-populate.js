/**
 * @typedef {{ path: string, select: string }} PopulateObject
 * @param {string} selectedStr
 * @param {PopulateObject[]} populatedFields
 * @returns {{ select: string, populate: PopulateObject[] }} { select: string, populate: PopulateObject[] }
 */
export default (selectedStr = '', populatedFields = []) => {
  if (!selectedStr || !populatedFields.length) {
    return { select: null, populate: null };
  }
  let selectedArr = selectedStr.split(/\s+/g);
  let select = '';
  const populate = [];

  populatedFields.forEach((field) => {
    if (typeof field === 'string' && selectedArr.includes(field)) {
      populate.push({ path: field });
      selectedArr = selectedArr.filter((f) => f !== field);
      select += ` ${field}_id`;
    } else if (field && field.path && selectedArr.includes(field.path)) {
      const obj = { path: field.path };
      field.select && (obj.select = field.select);
      field.populate && (obj.populate = field.populate);
      populate.push(obj);

      selectedArr = selectedArr.filter((f) => f !== field.path);
      select += ` ${field.path}_id`;
    }
  });

  return { select, populate };
};
