import { ModelStatic } from 'sequelize/types';
import jsonStringify from 'json-stable-stringify';

import { isSequelizeModelClass, isSequelizeOp } from './utils';
import { FindUniqueOptions } from './types';

interface Serializer {
  test: (key: string, value: unknown) => boolean;
  serialize: (key: string, value: unknown) => any;
}

const serializers: Serializer[] = [
  {
    test: (key: string, value: unknown) => isSequelizeModelClass(value),
    serialize: (key: string, value: unknown) =>
      `__model:${(value as ModelStatic<any>).getTableName()}`,
  },
  {
    test: (key: string, value: unknown) =>
      Object.prototype.toString.call(value) === '[object Object]' &&
      Object.getOwnPropertySymbols(value).length > 0,
    serialize: (key: string, value: unknown) => {
      const symbols = Object.getOwnPropertySymbols(value);

      const obj: any = { ...(value as any) };

      for (const symbol of symbols) {
        if (!isSequelizeOp(symbol)) {
          throw new Error('Found non-operator symbol from findUnique options');
        }

        const symbolString = symbol.toString();

        const name =
          symbolString === 'Symbol()'
            ? `Symbol(${Math.round(Math.random() * 10e9)})`
            : symbolString;

        obj[`__op:${name}`] = obj[symbol];
      }

      return obj;
    },
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
