import { Op, Model, WhereOptions, FindOptions } from 'sequelize';
import jsonStringify from 'json-stable-stringify';

export const findRowByWhere = <ModelType extends Model>(
  rows: ModelType[],
  where: WhereOptions,
): ModelType | undefined => {
  const entries = Object.entries(where);

  return rows.find((row) => {
    return entries.every(([column, value]) => row.get(column) === value);
  });
};

export const getWhereQuery = (
  keys: ReadonlyArray<FindOptions<any>>,
): WhereOptions => {
  const where: WhereOptions<any> = {};

  const entries = keys.flatMap((key) => Object.entries(key.where ?? {}));

  for (const entry of entries) {
    const [column, value] = entry;

    where[column] = where[column] ?? { [Op.in]: [] };

    if (!where[column][Op.in].includes(value)) {
      where[column][Op.in].push(value);
    }
  }

  return where;
};

const serializeReplacer = (key: string, value: any): string => {
  if (typeof value === 'function' && value.prototype instanceof Model) {
    return `__model:${value.getTableName()}`;
  }

  return value;
};

export const serializeQueryOptions = (queryOptions: any): string => {
  return jsonStringify(queryOptions, { replacer: serializeReplacer });
};
