import { Model, Attributes } from 'sequelize';
import DataLoader, { BatchLoadFn } from 'dataloader';

import serializeBatchKey from './serializeBatchKey';
import serializeLoadKey from './serializeLoadKey';
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

export interface DataLoaderCache<ModelType extends Model> {
  get(key: string): ModelDataLoader<ModelType> | undefined;
  set(key: string, value: ModelDataLoader<ModelType>): void;
  delete(key: string): void;
}

export interface DataLoaderManagerOptions<ModelType extends Model> {
  cache?: DataLoaderCache<ModelType>;
  serializeBatchKey?: (options: FindUniqueOptions<ModelType>) => string;
  serializeLoadKey?: (options: FindUniqueOptions<ModelType>) => string;
}

export class Cache<ModelType extends Model>
  implements DataLoaderCache<ModelType>
{
  cache: Map<string, ModelDataLoader<ModelType>>;

  constructor() {
    this.cache = new Map();
  }

  get(key: string) {
    return this.cache.get(key);
  }

  set(key: string, value: ModelDataLoader<ModelType>) {
    this.cache.set(key, value);
  }

  delete(key: string) {
    this.cache.delete(key);
  }
}

class DataLoaderManager<ModelType extends Model> {
  batchLoadFn: ModelBatchLoadFn<ModelType>;
  cache: DataLoaderCache<ModelType>;
  serializeBatchKey: (options: FindUniqueOptions<ModelType>) => string;
  serializeLoadKey: (options: FindUniqueOptions<ModelType>) => string;

  constructor(
    batchLoadFn: ModelBatchLoadFn<ModelType>,
    options?: DataLoaderManagerOptions<ModelType>,
  ) {
    this.batchLoadFn = batchLoadFn;
    this.cache = options?.cache ?? new Cache();
    this.serializeBatchKey = options?.serializeBatchKey ?? serializeBatchKey;
    this.serializeLoadKey = options?.serializeLoadKey ?? serializeLoadKey;
  }

  getDataLoader(options: FindUniqueOptions<any>): ModelDataLoader<ModelType> {
    const cacheKey = this.serializeBatchKey(options);

    const cachedLoader = this.cache.get(cacheKey);

    if (cachedLoader) {
      return cachedLoader;
    }

    const loader = new DataLoader(this.batchLoadFn, {
      cache: false,
      cacheKeyFn: this.serializeLoadKey,
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
