import { Sequelize, DataTypes } from 'sequelize';

import makeFindUnique from '../makeFindUnique';

const sequelize = new Sequelize('sqlite::memory:');

const User = sequelize.define('user', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.TEXT, unique: true },
});

const Comment = sequelize.define('comment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER },
  content: { type: DataTypes.TEXT },
});

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

User.hasMany(Comment);
Comment.belongsTo(User);

describe('makeFindUnique', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  it('batches queries correctly', async () => {
    const onLoadBatch = jest.fn();

    const findUniqueUser = makeFindUnique(User, { onLoadBatch });

    User.bulkCreate([
      { username: 'kalle' },
      { username: 'elina' },
      { username: 'lasse' },
    ]);

    const result = await Promise.all([
      findUniqueUser({
        where: {
          username: 'kalle',
        },
        attributes: ['username', 'id'],
      }),
      findUniqueUser({
        where: {
          username: 'elina',
        },
        attributes: ['username', 'id'],
      }),
      findUniqueUser({
        where: {
          username: 'lasse',
        },
        attributes: ['username', 'id'],
      }),
    ]);

    const { calls } = onLoadBatch.mock;

    expect(onLoadBatch).toHaveBeenCalledTimes(1);
    expect(calls).toMatchSnapshot();
    expect(result).toMatchSnapshot();
  });

  it('batches queries correctly with composite unique columns', async () => {
    const onLoadBatch = jest.fn();

    const findUniquePerson = makeFindUnique(Person, { onLoadBatch });

    Person.bulkCreate([
      { firstName: 'Kalle', lastName: 'Ilves' },
      { firstName: 'John', lastName: 'Doe' },
    ]);

    const result = await Promise.all([
      findUniquePerson({
        where: {
          firstName: 'Kalle',
          lastName: 'Ilves',
        },
        attributes: ['id', 'firstName', 'lastName'],
      }),
      findUniquePerson({
        where: {
          firstName: 'John',
          lastName: 'Doe',
        },
        attributes: ['id', 'firstName', 'lastName'],
      }),
    ]);

    const { calls } = onLoadBatch.mock;

    expect(onLoadBatch).toHaveBeenCalledTimes(1);
    expect(calls).toMatchSnapshot();
    expect(result).toMatchSnapshot();
  });

  it('queries with same include and attributes parameters are in the same batch', async () => {
    const onLoadBatch = jest.fn();

    const findUniqueUser = makeFindUnique(User, { onLoadBatch });

    User.bulkCreate([
      { username: 'kalle', id: 1 },
      { username: 'elina', id: 2 },
      { username: 'lasse', id: 3 },
    ]);

    Comment.bulkCreate([
      { content: 'text 1', userId: 1 },
      { content: 'text 2', userId: 2 },
    ]);

    const result = await Promise.all([
      findUniqueUser({
        where: {
          username: 'kalle',
        },
        attributes: ['username', 'id'],
        include: { model: Comment, attributes: ['id', 'content'] },
      }),
      findUniqueUser({
        where: {
          username: 'elina',
        },
        attributes: ['username', 'id'],
        include: { model: Comment, attributes: ['id', 'content'] },
      }),
      findUniqueUser({
        where: {
          username: 'lasse',
        },
        attributes: ['username', 'id'],
        include: { model: Comment, attributes: ['id', 'content'] },
      }),
    ]);

    const { calls } = onLoadBatch.mock;

    expect(onLoadBatch).toHaveBeenCalledTimes(1);
    expect(calls).toMatchSnapshot();
    expect(result).toMatchSnapshot();
  });

  it('queries with different include or attributes parameters are not in the same batch', async () => {
    const onLoadBatch = jest.fn();

    const findUniqueUser = makeFindUnique(User, { onLoadBatch });

    User.bulkCreate([
      { username: 'kalle', id: 1 },
      { username: 'elina', id: 2 },
    ]);

    Comment.bulkCreate([{ content: 'text 1', userId: 1 }]);

    const result = await Promise.all([
      findUniqueUser({
        where: {
          username: 'kalle',
        },
        attributes: ['username', 'id'],
        include: { model: Comment, attributes: ['id', 'content'] },
      }),
      findUniqueUser({
        where: {
          username: 'elina',
        },
        attributes: ['username'],
      }),
    ]);

    const { calls } = onLoadBatch.mock;

    expect(onLoadBatch).toHaveBeenCalledTimes(2);
    expect(calls).toMatchSnapshot();
    expect(result).toMatchSnapshot();
  });

  it('queries with different where parameters are not in the same batch', async () => {
    const onLoadBatch = jest.fn();

    const findUniqueUser = makeFindUnique(User, { onLoadBatch });

    User.bulkCreate([
      { username: 'kalle', id: 1 },
      { username: 'elina', id: 2 },
    ]);

    Comment.bulkCreate([{ content: 'text 1', userId: 1 }]);

    const result = await Promise.all([
      findUniqueUser({
        where: {
          username: 'kalle',
        },
        attributes: ['username', 'id'],
      }),
      findUniqueUser({
        where: {
          id: 2,
        },
        attributes: ['username', 'id'],
      }),
    ]);

    const { calls } = onLoadBatch.mock;

    expect(onLoadBatch).toHaveBeenCalledTimes(2);
    expect(calls).toMatchSnapshot();
    expect(result).toMatchSnapshot();
  });
});
