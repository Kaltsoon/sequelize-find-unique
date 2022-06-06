# 🦄 sequelize-find-unique

[![Test](https://github.com/Kaltsoon/sequelize-find-unique/actions/workflows/test.yml/badge.svg)](https://github.com/Kaltsoon/sequelize-find-unique/actions/workflows/test.yml) [![npm](https://img.shields.io/npm/v/sequelize-find-unique)](https://www.npmjs.com/package/sequelize-find-unique)

Finder for retrieving a single Sequelize model entry by a unique column or a unique combination of multiple columns. Queries that occur in the same tick and have the same `where`, `attributes`, and `include` parameters are automatically batched using a [dataloader](https://github.com/graphql/dataloader) and will result in a single database query. This is very useful, especially on a GraphQL server to avoid the [N+1 Problem](https://shopify.engineering/solving-the-n-1-problem-for-graphql-through-batching).

This library is heavily inspired by [Prisma's](https://www.prisma.io/) `findUnique` method.

## Install

With npm:

```bash
npm install sequelize-find-unique
```

With Yarn:

```bash
yarn add sequelize-find-unique
```

## How to use?

A `findUnique` function can be built for a specific Sequelize model by using the `makeFindUnique` function:

```js
const { Sequelize, DataTypes } = require('sequelize');
const { makeFindUnique } = require('sequelize-find-unique');

const sequelize = new Sequelize('sqlite::memory:');

const User = sequelize.define('user', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.TEXT, unique: true },
});

const findUniqueUser = makeFindUnique(User);

// ...

// These queries have the same columns in the where parameter, so they are batched. Just one database query is executed
const users = await Promise.all([
  findUniqueUser({
    where: {
      username: 'john',
    },
  }),
  findUniqueUser({
    where: {
      username: 'mary',
    },
  }),
]);
```

The two `findUniqueUser` queries in the example are batched and only one database query is executed.

### Using as model's static method

The `findUnique` (or name of your choice) static method can be defined for a model in the following way:

```js
User.findUnique = makeFindUnique(User);

// ...

const user = await User.findUnique({
  where: {
    username: 'kalle',
  },
});
```

### Attributes

Queries with the same `attributes` parameter are batched:

```js
// These queries have the same attributes parameter, so they are batched. Just one database query is executed
const users = await Promise.all([
  User.findUnique({
    where: {
      username: 'john',
    },
    attributes: ['username'],
  }),
  User.findUnique({
    where: {
      username: 'mary',
    },
    attributes: ['username'],
  }),
]);
```

Note that, if the `attributes` parameter is provided, columns used in the `where` parameter **must be present** in the `attributes` parameter.

### Associations

Queries with the same `include` parameter are batched:

```js
// These queries have the same include parameter, so they are batched. Just one database query is executed
const users = await Promise.all([
  User.findUnique({
    where: {
      username: 'john',
    },
    include: { model: Comment },
  }),
  User.findUnique({
    where: {
      username: 'mary',
    },
    include: { model: Comment },
  }),
]);
```

### Composite unique columns

Composite unique columns work just like a single unique column:

```js
// These queries have the same columns in the where parameter, so they are batched. Just one database query is executed
const persons = await Promise.all([
  Person.findUnique({
    where: {
      firstName: 'Kalle',
      lastName: 'Ilves',
    },
  }),
  Person.findUnique({
    where: {
      firstName: 'John',
      lastName: 'Doe',
    },
  }),
]);
```

### Custom serializers

Serializers can be used to customize the batching behavior. The `serializeBatchKey` option can be used to customize which queries go to the same batch. That is, queries that occur on the same tick will be batched based on the string key returned by the `serializeBatchKey`. The default `serializeBatchKey` serializer serializes the columns in the `where` parameter, the `attributes` parameter, and the `include` parameter.

The `serielizeLoadKey` option can be used to customize the DataLoader's [cacheKeyFn](https://github.com/graphql/dataloader#api) function. The default `serielizeLoadKey` serializer serializes the `where` parameter.

Both functions receive the options provided for the `findUnique` function and should return a string. The `serializeBatchKey` and `serializeLoadKey` can be provided using the second argument, the options object, of the `makeFindUnique` function:

```js
const customSerializeBatchKey = (options) => {
  return JSON.stringify(Object.keys(options.where));
};

const customSerializeLoadKey = (options) => {
  return JSON.stringify(options.where);
};

User.findUnique = makeFindUnique(User, {
  serializeBatchKey: customSerializeBatchKey,
  serializeLoadKey: customSerializeLoadKey,
});
```

### Custom cache

The `cache` option can be used to provide a custom DataLoader cache implementation. The cache keys are string and values [DataLoader](https://github.com/graphql/dataloader#api) instances. The cache implementation should implement `get`, `set`, and `delete` methods:

```js
class CustomCache {
  get(key) {
    // ...
  }

  set(key, value) {
    // ...
  }

  delete(key) {
    // ...
  }
}

User.findUnique = makeFindUnique(User, {
  cache: new CustomCache(),
});
```

The default cache implementation is a simple wrapper around [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map).

## TypeScript

The library is written in TypeScript, so types are on the house!

If you are using a static method like in the previous examples, just declare the method on your model class:

```ts
import { makeFindUnique, FindUniqueOptions } from 'sequelize-find-unique';

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<number>;
  declare username: string;

  declare static findUnique: (
    options: FindUniqueOptions<Attributes<User>>,
  ) => Promise<User | null>;
}

// ...

User.findUnique = makeFindUnique(User);
```
