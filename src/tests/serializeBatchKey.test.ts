import { Op } from 'sequelize';

import serializeBatchKey from '../serializeBatchKey';
import { sequelize, Comment } from './models';

describe('serializeBatchKey', () => {
  test('serializes primitive values correctly', () => {
    expect(
      serializeBatchKey({
        where: {
          firstName: 'Kalle',
          lastName: 'Ilves',
        },
        attributes: ['firstName', 'lastName'],
      }),
    ).toMatchSnapshot();
  });

  test('serializes model references correctly', () => {
    expect(
      serializeBatchKey({
        where: {
          firstName: 'Kalle',
          lastName: 'Ilves',
        },
        attributes: ['firstName', 'lastName'],
        include: [{ model: Comment, as: 'comments' }],
      }),
    ).toMatchSnapshot();
  });

  test('serializes fn correctly', () => {
    expect(
      serializeBatchKey({
        where: {
          firstName: 'Kalle',
          lastName: 'Ilves',
        },
        attributes: [
          'firstName',
          'lastName',
          [sequelize.fn('COUNT', sequelize.col('column')), 'column_alias'],
        ],
      }),
    ).toMatchSnapshot();
  });

  test('serializes Op correctly', () => {
    expect(
      serializeBatchKey({
        where: {
          firstName: 'Kalle',
          lastName: 'Ilves',
        },
        attributes: ['firstName', 'lastName'],
        include: [
          {
            model: Comment,
            as: 'comments',
            where: {
              [Op.or]: [{ id: { [Op.gt]: 5 } }, { id: { [Op.ne]: 100 } }],
            },
          },
        ],
      }),
    ).toMatchSnapshot();
  });

  test('throws error for non-serializable values', () => {
    expect(() =>
      serializeBatchKey({
        where: {
          firstName: 'Kalle',
          lastName: 'Ilves',
        },
        attributes: [
          'firstName',
          'lastName',
          () => {
            return undefined;
          },
        ] as any,
      }),
    ).toThrowErrorMatchingSnapshot();
  });
});
