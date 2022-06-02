import { Model, FindOptions } from 'sequelize';
import DataLoader, { BatchLoadFn } from 'dataloader';
import { serializeQueryOptions } from './utils';

type ModelBatchLoadFn<ModelType extends Model> = BatchLoadFn<
  FindOptions<any>,
  ModelType | null
>;

type ModelDataLoader<ModelType extends Model> = DataLoader<
  FindOptions<any>,
  ModelType | null
>;

class DataLoaderManager<ModelType extends Model> {
  batchLoadFn: ModelBatchLoadFn<ModelType>;
  loaderCache: Map<string, ModelDataLoader<ModelType>>;

  constructor(batchLoadFn: BatchLoadFn<FindOptions<any>, ModelType | null>) {
    this.batchLoadFn = batchLoadFn;
    this.loaderCache = new Map();
  }

  cacheKeyFn = (queryOptions: FindOptions<any>): string =>
    serializeQueryOptions({ where: queryOptions.where });

  getDataLoader(
    queryOptions: FindOptions<any>,
  ): ModelDataLoader<ModelType> {
    const { where, ...restQueryOptions } = queryOptions;

    const cacheKey = serializeQueryOptions({
      where: where ? Object.keys(where) : undefined,
      ...restQueryOptions,
    });

    const cachedLoader = this.loaderCache.get(cacheKey);

    if (cachedLoader) {
      return cachedLoader;
    }

    const loader = new DataLoader(this.batchLoadFn, {
      cache: false,
      cacheKeyFn: this.cacheKeyFn,
    });

    const loadFn = loader.load;

    loader.load = async (key: FindOptions<any>) => {
      const items = await loadFn.apply(loader, [key]);

      this.loaderCache.delete(cacheKey);

      return items;
    };

    this.loaderCache.set(cacheKey, loader);

    return loader;
  }
}

export default DataLoaderManager;
