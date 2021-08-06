/**
 *
 * @description find with full options
 * @param {import "mongoose".Model } Model mongoose model
 * @param {{query: {}, select: string, limit: number, page: number, sort: string, populate: string}} { query = {}, select = null, limit = 0, page = 1, sort = null, populate = '' }
 * @returns {Promise<any[]>} result
 */
const findAdvanced = async (
  Model,
  { query = {}, select = null, limit = 0, page = 1, sort = null, populate = '', session = null }
) => {
  const skip = page && (page - 1) * limit;
  const res = await Model.find(query, select, {
    skip: +skip,
    limit: +limit,
    sort,
    populate
    // session
  });
  return res;
};

export default findAdvanced;
