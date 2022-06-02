import { FindOptions, ModelStatic, Model, Attributes } from 'sequelize';
import DataLoaderManager from './dataLoaderManager';
import { findRowByWhere, getWhereQuery } from './utils';

const noop = () => {
  return undefined;
};

interface MakeFindUniqueOptions {
  onLoadBatch: (keys: ReadonlyArray<FindOptions<any>>) => void;
}

const makeFindUnique = <ModelType extends Model>(
  Model: ModelStatic<ModelType>,
  options?: MakeFindUniqueOptions,
) => {
  const onLoadBatch = options?.onLoadBatch ?? noop;

  const batchLoadFn = async (
    keys: ReadonlyArray<FindOptions<any>>,
  ): Promise<Array<ModelType | null>> => {
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

  const manager = new DataLoaderManager<ModelType>(batchLoadFn);

  const findUnique = (
    queryOptions: FindOptions<Attributes<ModelType>>,
  ): Promise<ModelType | null> => {
    const loader = manager.getDataLoader(queryOptions);

    return loader.load(queryOptions);
  };

  return findUnique;
};

export default makeFindUnique;
