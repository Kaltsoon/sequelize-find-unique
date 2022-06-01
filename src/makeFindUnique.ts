import { FindOptions, ModelStatic } from 'sequelize';
import DataLoaderManager from './dataLoaderManager';
import { findRowByWhere, getWhereQuery } from './utils';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

interface MakeFindUniqueOptions {
  onLoadBatch: (keys: ReadonlyArray<FindOptions<any>>) => void;
}

const makeFindUnique = <ModelClass extends ModelStatic<any>>(
  Model: ModelClass,
  options: MakeFindUniqueOptions,
) => {
  const onLoadBatch = options?.onLoadBatch ?? noop;

  const batchLoadFn = async (keys: ReadonlyArray<FindOptions<any>>) => {
    onLoadBatch(keys);

    const whereQuery = getWhereQuery(keys);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { where, ...restQueryOptions } = keys[0];

    const rows = await Model.findAll({
      where: whereQuery,
      ...restQueryOptions,
    });

    return keys.map((key) =>
      key.where ? findRowByWhere(rows, key.where) ?? null : null,
    );
  };

  const manager = new DataLoaderManager(batchLoadFn);

  const findUnique = (
    queryOptions: FindOptions<any>,
  ): Promise<InstanceType<ModelClass> | null> => {
    const loader = manager.getLoader(queryOptions);

    return loader.load(queryOptions);
  };

  return findUnique;
};

export default makeFindUnique;
