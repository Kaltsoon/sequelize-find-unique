import { WhereOptions, FindAttributeOptions, Includeable } from 'sequelize';

export interface FindUniqueOptions<Attributes = any> {
  where: WhereOptions<Attributes>;
  attributes?: FindAttributeOptions;
  include?: Includeable | Includeable[];
}

export type Primitive = number | string | boolean | null | undefined;
