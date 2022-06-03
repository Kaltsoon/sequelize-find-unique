import { FindOptions, ModelStatic, Model, Attributes } from 'sequelize';

import DataLoaderManager, { ModelBatchLoadFn } from './dataLoaderManager';
import { findRowByWhere, getWhereQuery } from './utils';
import { FindUniqueOptions } from './types';

const noop = () => {
  return undefined;
};

interface MakeFindUniqueOptions {
  onLoadBatch: (keys: ReadonlyArray<FindOptions<any>>) => void;
}

const makeFindUnique = <ModelType extends Model>(
  model: ModelStatic<ModelType>,
  options?: MakeFindUniqueOptions,
) => {
  const onLoadBatch = options?.onLoadBatch ?? noop;

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

  const manager = new DataLoaderManager<ModelType>(batchLoadFn);

  const findUnique = (
    queryOptions: FindUniqueOptions<Attributes<ModelType>>,
  ): Promise<ModelType | null> => {
    const loader = manager.getDataLoader(queryOptions);

    return loader.load(queryOptions);
  };

  return findUnique;
};

export default makeFindUnique;
