/**
 *
 *
 * @param {*} [select, limit, skip, sort]
 * @returns {*} [select, limit, skip, sort]
 */
const varAggregation = ({ select, limit, page, sort }) => {
  return [
    ...(sort
      ? [
          {
            $sort: sort
              .split(' ')
              .reduce(
                (pre, cur) =>
                  cur[0] === '-' ? { ...pre, [cur.slice(1)]: -1 } : { ...pre, [cur]: 1 },
                0
              )
          }
        ]
      : []),
    ...(page ? [{ $skip: limit ? (page - 1) * limit : 0 }] : []),
    ...(limit ? [{ $limit: +limit }] : []),
    ...(select
      ? [
          {
            $project: select
              .trim()
              .split(' ')
              .reduce(
                (pre, cur) =>
                  cur[0] === '-' ? { ...pre, [cur.slice(1)]: 0 } : { ...pre, [cur]: 1 },
                0
              )
          }
        ]
      : [])
  ];
};

export default varAggregation;
