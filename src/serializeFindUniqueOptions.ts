import { ModelStatic } from 'sequelize/types';
import jsonStringify from 'json-stable-stringify';

import { isSequelizeModelClass } from './utils';
import { FindUniqueOptions } from './types';

interface Serializer {
  test: (key: string, value: unknown) => boolean;
  serialize: (key: string, value: unknown) => string;
}

const serializers: Serializer[] = [
  {
    test: (key: string, value: unknown) => isSequelizeModelClass(value),
    serialize: (key: string, value: unknown) =>
      `__model:${(value as ModelStatic<any>).getTableName()}`,
  },
];

const serializeReplacer = (key: string, value: unknown): unknown => {
  const serializer = serializers.find(({ test }) => test(key, value));

  if (serializer) {
    return serializer.serialize(key, value);
  }

  if (typeof value === 'function') {
    throw new Error('Found non-serializable function from findUnique options');
  }

  return value;
};

const serializeFindUniqueOptions = (
  options: FindUniqueOptions<any>,
): string => {
  const { where, include, attributes } = options;

  const whereKeys = where ? Object.keys(where) : [];

  return jsonStringify(
    { where: whereKeys, include, attributes },
    { replacer: serializeReplacer },
  );
};

export default serializeFindUniqueOptions;
