import { Op } from 'sequelize';

import serializeFindUniqueOptions from '../serializeFindUniqueOptions';
import { sequelize, Comment } from './models';

describe('serializeFindUniqueOptions', () => {
  test('serializes primitive values correctly', () => {
    expect(
      serializeFindUniqueOptions({
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
      serializeFindUniqueOptions({
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
      serializeFindUniqueOptions({
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
      serializeFindUniqueOptions({
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
      serializeFindUniqueOptions({
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
