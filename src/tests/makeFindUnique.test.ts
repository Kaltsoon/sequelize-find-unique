import makeFindUnique from '../makeFindUnique';
import { sequelize, User, Comment, Person } from './models';
import { Cache } from '../dataLoaderManager';

describe('makeFindUnique', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  it('batches queries correctly', async () => {
    const onLoadBatch = jest.fn();

    const findUniqueUser = makeFindUnique(User, { onLoadBatch });

    await User.bulkCreate([
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

    await Person.bulkCreate([
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

  it('defining as a static model method works', async () => {
    User.findUnique = makeFindUnique(User);

    await User.create({ username: 'kalle' });

    const user = await User.findUnique({
      where: {
        username: 'kalle',
      },
      attributes: ['id', 'username'],
    });

    expect(user).toMatchSnapshot();
  });

  it('queries with same include and attributes parameters are in the same batch', async () => {
    const onLoadBatch = jest.fn();

    const findUniqueUser = makeFindUnique(User, { onLoadBatch });

    await User.bulkCreate([
      { username: 'kalle', id: 1 },
      { username: 'elina', id: 2 },
      { username: 'lasse', id: 3 },
    ]);

    await Comment.bulkCreate([
      { content: 'text 1', userId: 1 },
      { content: 'text 2', userId: 2 },
    ]);

    const result = await Promise.all([
      findUniqueUser({
        where: {
          username: 'kalle',
        },
        attributes: ['username', 'id'],
        include: {
          model: Comment,
          attributes: ['id', 'content'],
          as: 'comments',
        },
      }),
      findUniqueUser({
        where: {
          username: 'elina',
        },
        attributes: ['username', 'id'],
        include: {
          model: Comment,
          attributes: ['id', 'content'],
          as: 'comments',
        },
      }),
      findUniqueUser({
        where: {
          username: 'lasse',
        },
        attributes: ['username', 'id'],
        include: {
          model: Comment,
          attributes: ['id', 'content'],
          as: 'comments',
        },
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

    await User.bulkCreate([
      { username: 'kalle', id: 1 },
      { username: 'elina', id: 2 },
    ]);

    await Comment.bulkCreate([{ content: 'text 1', userId: 1 }]);

    const result = await Promise.all([
      findUniqueUser({
        where: {
          username: 'kalle',
        },
        attributes: ['username', 'id'],
        include: {
          model: Comment,
          attributes: ['id', 'content'],
          as: 'comments',
        },
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

    await User.bulkCreate([
      { username: 'kalle', id: 1 },
      { username: 'elina', id: 2 },
    ]);

    await Comment.bulkCreate([{ content: 'text 1', userId: 1 }]);

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

  it('calls cache methods corrrectly', async () => {
    const cache = new Cache();

    jest.spyOn(cache, 'get');

    const findUniqueUser = makeFindUnique(User, { cache });

    await User.bulkCreate([{ username: 'kalle' }, { username: 'elina' }]);

    await Promise.all([
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
    ]);

    expect(cache.get).toHaveBeenCalledTimes(2);
  });

  it('clears cache after successful query', async () => {
    const cache = new Cache();

    jest.spyOn(cache, 'delete');

    const findUniqueUser = makeFindUnique(User, { cache });

    await User.bulkCreate([{ username: 'kalle' }, { username: 'elina' }]);

    await Promise.all([
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
    ]);

    expect(cache.cache.size).toBe(0);
    expect(cache.delete).toHaveBeenCalledTimes(2);
  });

  it('clears cache after failed query', async () => {
    const cache = new Cache();

    jest.spyOn(cache, 'delete');

    const findUniqueUser = makeFindUnique(User, { cache });

    await User.create({ username: 'kalle' });

    await expect(
      findUniqueUser({
        where: {
          username: 'kalle',
        },
        attributes: ['age'],
      }),
    ).rejects.toThrow();

    expect(cache.cache.size).toBe(0);
    expect(cache.delete).toHaveBeenCalledTimes(1);
  });
});
