import { Op, Model, WhereOptions, FindOptions, ModelStatic } from 'sequelize';

import { Primitive } from './types';

const OP_VALUES = Object.values(Op);

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

export const isSequelizeModelClass = (
  value: unknown,
): value is ModelStatic<any> => {
  return typeof value === 'function' && value.prototype instanceof Model;
};

export const isSequelizeOp = (value: unknown): value is Symbol => {
  return OP_VALUES.includes(value);
};

export const isPrimitive = (value: unknown): value is Primitive => {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'undefined' ||
    value === null
  );
};
