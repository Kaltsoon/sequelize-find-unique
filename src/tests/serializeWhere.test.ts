import serializeWhere from '../serializeWhere';

describe('serializeFindUniqueOptions', () => {
  test('serializes primitive values correctly', () => {
    expect(
      serializeWhere({
        firstName: 'Kalle',
        lastName: 'Ilves',
      }),
    ).toMatchSnapshot();
  });

  test('throws error for non-primitive values', () => {
    expect(() =>
      serializeWhere({
        firstName: 'Kalle',
        lastName: 'Ilves',
        friends: ['elina'],
      }),
    ).toThrowErrorMatchingSnapshot();
  });
});
