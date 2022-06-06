import serializeLoadKey from '../serializeLoadKey';

describe('serializeLoadKey', () => {
  test('serializes primitive values correctly', () => {
    expect(
      serializeLoadKey({
        where: {
          firstName: 'Kalle',
          lastName: 'Ilves',
        },
      }),
    ).toMatchSnapshot();
  });

  test('throws error for non-primitive values', () => {
    expect(() =>
      serializeLoadKey({
        where: {
          firstName: 'Kalle',
          lastName: 'Ilves',
          friends: ['elina'],
        },
      }),
    ).toThrowErrorMatchingSnapshot();
  });

  test('ignores non-where parameters', () => {
    expect(
      serializeLoadKey({
        where: {
          firstName: 'Kalle',
          lastName: 'Ilves',
        },
        attributes: ['firstName', 'lastName'],
      }),
    ).toMatchSnapshot();
  });
});
