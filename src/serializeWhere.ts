import { WhereOptions } from 'sequelize';
import jsonStringify from 'json-stable-stringify';

import { isPrimitive } from './utils';

const parseWhere = (value: unknown): WhereOptions => {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Where parameter must be an object');
  }

  const entries = Object.entries(value);

  for (const [key, value] of entries) {
    if (!isPrimitive(value)) {
      throw new Error(
        `Where parameter properties can only contain serializable primitive values. Found value of type "${typeof value}" in property "${key}"`,
      );
    }
  }

  return value as WhereOptions;
};

const serializeWhere = (maybeWhere: unknown): string => {
  const where = parseWhere(maybeWhere);

  return jsonStringify(where);
};

export default serializeWhere;
