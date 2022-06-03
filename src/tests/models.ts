import {
  Sequelize,
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  Attributes,
  FindOptions,
} from 'sequelize';

import { FindUniqueOptions } from '../types';

export const sequelize = new Sequelize('sqlite::memory:');

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

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    username: { type: DataTypes.TEXT, unique: true },
  },
  { tableName: 'users', sequelize },
);

export class Comment extends Model<
  InferAttributes<Comment>,
  InferCreationAttributes<Comment>
> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare content: string;
}

Comment.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER },
    content: { type: DataTypes.TEXT },
  },
  { tableName: 'comments', sequelize },
);

export class Person extends Model<
  InferAttributes<Person>,
  InferCreationAttributes<Person>
> {
  declare id: CreationOptional<number>;
  declare firstName: string;
  declare lastName: string;
}

Person.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    firstName: { type: DataTypes.TEXT },
    lastName: { type: DataTypes.TEXT },
  },
  {
    tableName: 'persons',
    sequelize,
    indexes: [
      {
        unique: true,
        fields: ['firstName', 'lastName'],
      },
    ],
  },
);

User.hasMany(Comment, {
  foreignKey: 'userId',
  as: 'comments',
});

Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
