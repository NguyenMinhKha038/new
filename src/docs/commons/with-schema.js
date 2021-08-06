import { set, cloneDeep } from 'lodash';

export default function (thisSchema = {}, props = {}) {
  try {
    const newSchema = cloneDeep(thisSchema);
    for (const [key, val] of Object.entries(props)) {
      set(newSchema, key, val);
    }
    return newSchema;
  } catch (err) {
    console.log(err);
    return thisSchema;
  }
}
