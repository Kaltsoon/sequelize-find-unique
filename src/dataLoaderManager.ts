import { Model, FindOptions } from 'sequelize';
import DataLoader, { BatchLoadFn } from 'dataloader';
import { serializeQueryOptions } from './utils';

class DataLoaderManager<ModelType extends Model> {
  batchLoadFn: BatchLoadFn<FindOptions<any>, ModelType>;
  loaderCache: Map<string, DataLoader<FindOptions<any>, ModelType>>;

  constructor(batchLoadFn: BatchLoadFn<FindOptions<any>, ModelType>) {
    this.batchLoadFn = batchLoadFn;
    this.loaderCache = new Map();
  }

  cacheKeyFn = (queryOptions: FindOptions<any>): string =>
    serializeQueryOptions({ where: queryOptions.where });

  getLoader(
    queryOptions: FindOptions<any>,
  ): DataLoader<FindOptions<any>, ModelType> {
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
