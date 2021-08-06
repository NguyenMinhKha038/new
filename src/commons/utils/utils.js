import { Types as MongoTypes } from 'mongoose';
import xss from 'xss';

const ObjectId = MongoTypes.ObjectId;

/**
 *
 * @param {number} number
 */
export function randomInt(number) {
  return Math.floor(Math.random() * Math.floor(number));
}

/**
 * @param {object|string|Array} args
 * @param options
 */
export function handleXss(
  args,
  options = {
    whiteList: [],
    stripIgnoreTag: false,
    allowCommentTag: false
  }
) {
  if (!args) return args;

  if (['boolean', 'number'].includes(typeof args)) {
    return args;
  }

  if ('string' === typeof args) return xss(args, options);

  if (Array.isArray(args)) {
    return args.map((arg) => handleXss(arg));
  }

  if (args instanceof Object) {
    const obj = {};
    for (const [prop, val] of Object.entries(args)) {
      obj[prop] = handleXss(val);
    }
    return obj;
  }

  throw new Error('args must be a string, object or array');
}

export function removeAccents(str, toLower = false) {
  if (!str || !(str + '').trim()) {
    return str;
  }
  const s = str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
  return toLower ? s.toLowerCase() : s;
}

export function getDateRangeQuery(fieldName, { fromDate = null, toDate = null }) {
  if (!fromDate && !toDate) {
    return {};
  }

  const query = { [fieldName]: {} };
  if (fromDate) {
    query[fieldName]['$gte'] = new Date(fromDate);
  }
  if (toDate) {
    query[fieldName]['$lte'] = new Date(toDate);
  }

  return query;
}

export function removeFields(fields = []) {
  const doc = this.toObject();
  fields.forEach((field) => {
    delete doc[field];
  });

  return doc;
}

export function pickFields(fields = []) {
  const orgDoc = this.toObject();
  const doc = {};
  fields.forEach((field) => {
    doc[field] = orgDoc[field];
  });

  return doc;
}

export function compareDates(d1, d2) {
  if (!d1 || !d2) {
    return false;
  }
  date1 = new Date(d1);
  date1Str = date1.getFullYear() + '-' + (date1.getMonth() + 1) + '-' + date1.getDate();

  date2 = new Date(d2);
  date2Str = date2.getFullYear() + '-' + (date2.getMonth() + 1) + '-' + date2.getDate();

  return date1Str === date2Str;
}

export function toObjectId(args) {
  if (!args) {
    return args;
  } else if (typeof args === 'string') {
    return ObjectId.isValid(args) ? new ObjectId(args) : args;
  } else if (Array.isArray(args)) {
    return args.map((arg) => (ObjectId.isValid(arg) ? new ObjectId(arg) : arg));
  } else if (typeof args === 'object') {
    return Object.keys(args).reduce((acc, cur) => {
      const item = args[cur];
      acc[cur] = ObjectId.isValid(item) ? new ObjectId(item) : item;
      return acc;
    }, {});
  }

  return args;
}
