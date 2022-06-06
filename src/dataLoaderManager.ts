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

export type ModelDataLoaderCache<ModelType extends Model> = Map<
  string,
  ModelDataLoader<ModelType>
>;

export interface DataLoaderManagerOptions<ModelType extends Model> {
  cache?: ModelDataLoaderCache<ModelType>;
}

class DataLoaderManager<ModelType extends Model> {
  batchLoadFn: ModelBatchLoadFn<ModelType>;
  cache: Map<string, ModelDataLoader<ModelType>>;

  constructor(
    batchLoadFn: ModelBatchLoadFn<ModelType>,
    options?: DataLoaderManagerOptions<ModelType>,
  ) {
    this.batchLoadFn = batchLoadFn;
    this.cache = options?.cache ?? new Map();
  }

  cacheKeyFn = (options: FindUniqueOptions<any>): string =>
    serializeWhere(options.where);

  getDataLoader(options: FindUniqueOptions<any>): ModelDataLoader<ModelType> {
    const cacheKey = serializeFindUniqueOptions(options);

    const cachedLoader = this.cache.get(cacheKey);

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
        this.cache.delete(cacheKey);
      }
    };

    this.cache.set(cacheKey, loader);

    return loader;
  }
}

export default DataLoaderManager;
