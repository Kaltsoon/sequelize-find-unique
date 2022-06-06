import { FindOptions, ModelStatic, Model, Attributes } from 'sequelize';

import DataLoaderManager, {
  ModelBatchLoadFn,
  DataLoaderCache,
} from './dataLoaderManager';

import { findRowByWhere, getWhereQuery } from './utils';
import { FindUniqueOptions } from './types';

const noop = () => {
  return undefined;
};

export interface MakeFindUniqueOptions<ModelType extends Model> {
  onLoadBatch?: (
    keys: ReadonlyArray<FindOptions<Attributes<ModelType>>>,
  ) => void;
  cache?: DataLoaderCache<ModelType>;
  serializeBatchKey?: (options: FindUniqueOptions<ModelType>) => string;
  serializeLoadKey?: (options: FindUniqueOptions<ModelType>) => string;
}

const makeFindUnique = <ModelType extends Model>(
  model: ModelStatic<ModelType>,
  options?: MakeFindUniqueOptions<ModelType>,
) => {
  const onLoadBatch = options?.onLoadBatch ?? noop;
  const cache = options?.cache;

  const batchLoadFn: ModelBatchLoadFn<ModelType> = async (keys) => {
    onLoadBatch(keys);

    const whereQuery = getWhereQuery(keys);

    const { include, attributes } = keys[0];

    const rows = await model.findAll({
      where: whereQuery,
      include,
      attributes,
    });

    return keys.map((key) =>
      key.where ? findRowByWhere(rows, key.where) ?? null : null,
    );
  };

  const manager = new DataLoaderManager<ModelType>(batchLoadFn, {
    cache,
  });

  const findUnique = (
    queryOptions: FindUniqueOptions<Attributes<ModelType>>,
  ): Promise<ModelType | null> => {
    const loader = manager.getDataLoader(queryOptions);

    return loader.load(queryOptions);
  };

  return findUnique;
};

export default makeFindUnique;
