# sequelize-find-unique

[![Test](https://github.com/Kaltsoon/sequelize-find-unique/actions/workflows/test.yml/badge.svg)](https://github.com/Kaltsoon/sequelize-find-unique/actions/workflows/test.yml)

Retrieves a single Sequelize model entry by a unique column (or a combination of multiple columns). Multiple queries with same `where`, `attributes` and `include` parameters are automatically batched using a [dataloader](https://github.com/graphql/dataloader) and will result in a single database query. This can come in handy for example on a GraphQL server.

This library is heavily inspired by [Prisma's](https://www.prisma.io/) `findUnique` method.

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

// These queries will be handled by a single database query
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

### Associations

Queries with the same `include` parameter are batched:

```js
// Queries have the same include parameter, so they are batched. Just one database query is executed
const users = await Promise.all([
  findUniqueUser({
    where: {
      username: 'john',
    },
    include: { model: Comment },
  }),
  findUniqueUser({
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
const Person = sequelize.define(
  'person',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    firstName: { type: DataTypes.INTEGER },
    lastName: { type: DataTypes.INTEGER },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ['firstName', 'lastName'],
      },
    ],
  },
);

const findUniquePerson = makeFindUnique(Person);

// These queries will be handled by a single database query
const persons = await Promise.all([
  findUniquePerson({
    where: {
      firstName: 'Kalle',
      lastName: 'Ilves',
    },
  }),
  findUniquePerson({
    where: {
      firstName: 'John',
      lastName: 'Doe',
    },
  }),
]);
```
