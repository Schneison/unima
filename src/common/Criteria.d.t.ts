type DistinctArrayTuple<T, V = any> = T extends [string, string, V]
    ? [string, string, V]
    : T extends [string, V]
    ? [string, V]
    : T extends V[]
    ? V[]
    : V;
type StringKeys<D = LooseObject> = Extract<keyof D, string>;
type LooseObject = Record<string, any>;
type Criteria2<D = LooseObject> = [StringKeys<D>, D[StringKeys<D>]];
type Criteria3<D = LooseObject> = [StringKeys<D>, string, D[StringKeys<D>]];
type CriteriaObj<D = LooseObject> = Partial<D>;
type CriteriaBase<D = LooseObject> =
    | Criteria2<DistinctArrayTuple<D>>
    | Criteria3<DistinctArrayTuple<D>>
    | CriteriaObj<D>;
type CriteriaList<D = LooseObject> = CriteriaBase<DistinctArrayTuple<D>>[];
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Criteria<D = LooseObject> = CriteriaBase<D> | CriteriaList<D>;
