import { Model, Attributes } from 'sequelize';
import DataLoader, { BatchLoadFn } from 'dataloader';

import serializeFindUniqueOptions from './serializeFindUniqueOptions';
import serializeWhere from './serializeWhere';
import { FindUniqueOptions } from './types';

export type ModelDataLoaderKey<ModelType extends Model> = FindUniqueOptions<
  Attributes<ModelType>
>;

export type ModelBatchLoadFn<ModelType extends Model> = BatchLoadFn<
  ModelDataLoaderKey<ModelType>,
  ModelType | null
>;

export type ModelDataLoader<ModelType extends Model> = DataLoader<
  ModelDataLoaderKey<ModelType>,
  ModelType | null
>;

class DataLoaderManager<ModelType extends Model> {
  batchLoadFn: ModelBatchLoadFn<ModelType>;
  loaderCache: Map<string, ModelDataLoader<ModelType>>;

  constructor(
    batchLoadFn: BatchLoadFn<FindUniqueOptions<any>, ModelType | null>,
  ) {
    this.batchLoadFn = batchLoadFn;
    this.loaderCache = new Map();
  }

  cacheKeyFn = (options: FindUniqueOptions<any>): string =>
    serializeWhere(options.where);

  getDataLoader(options: FindUniqueOptions<any>): ModelDataLoader<ModelType> {
    const cacheKey = serializeFindUniqueOptions(options);

    const cachedLoader = this.loaderCache.get(cacheKey);

    if (cachedLoader) {
      return cachedLoader;
    }

    const loader = new DataLoader(this.batchLoadFn, {
      cache: false,
      cacheKeyFn: this.cacheKeyFn,
    });

    const loadFn = loader.load;

    loader.load = async (key: ModelDataLoaderKey<ModelType>) => {
      try {
        const item = await loadFn.apply(loader, [key]);

        return item;
      } finally {
        this.loaderCache.delete(cacheKey);
      }
    };

    this.loaderCache.set(cacheKey, loader);

    return loader;
  }
}

export default DataLoaderManager;
