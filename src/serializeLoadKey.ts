import { WhereOptions } from 'sequelize';
import jsonStringify from 'json-stable-stringify';

import { isPrimitive } from './utils';
import { FindUniqueOptions } from './types';

const parseWhere = (options: FindUniqueOptions<any>): WhereOptions => {
  if (!options.where || typeof options.where !== 'object') {
    throw new Error('Where parameter must be an object');
  }

  const { where } = options;

  const entries = Object.entries(where);

  for (const [key, value] of entries) {
    if (!isPrimitive(value)) {
      throw new Error(
        `Where parameter properties can only contain serializable primitive values. Found value of type "${typeof value}" in property "${key}"`,
      );
    }
  }

  return where;
};

const serializeLoadKey = (options: FindUniqueOptions<any>): string => {
  const where = parseWhere(options);

  return jsonStringify(where);
};

export default serializeLoadKey;
