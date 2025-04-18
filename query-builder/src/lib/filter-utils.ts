// Define the supported filter operators according to Cube.js documentation
export type FilterOperator =
  // String, number and time dimensions
  | 'equals'
  | 'notEquals'
  // String dimensions
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'notStartsWith'
  | 'endsWith'
  | 'notEndsWith'
  // Number dimensions and measures
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  // String, number and time dimensions
  | 'set'
  | 'notSet'
  // Time dimensions
  | 'inDateRange'
  | 'notInDateRange'
  | 'beforeDate'
  | 'afterDate'
  // Measures
  | 'measureFilter';

export interface Filter {
  member: string;
  operator: string;
  values: string[];
}

// Type compatibility issue with CubeJS typings require us to use a type assertion
export const formatFilters = (filters: Filter[]) => {
  const formattedFilters = filters.map((filter) => ({
    member: filter.member,
    operator: filter.operator as FilterOperator,
    values: filter.values,
  }));

  // Cast to any to bypass the CubeJS type restrictions
  return formattedFilters as any;
};
