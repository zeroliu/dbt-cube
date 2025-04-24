import cubejs from '@cubejs-client/core';

// Initialize cubejs client with an API endpoint
export const cubejsApi = cubejs(
  process.env.NEXT_PUBLIC_CUBEJS_TOKEN ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.K9PiJkjegbhnw4Ca5pPlkTmZihoOm42w8bja9Qs2qJg',
  {
    apiUrl:
      process.env.NEXT_PUBLIC_CUBEJS_API_URL ||
      'http://localhost:4000/cubejs-api/v1',
  }
);

export interface CubeMember {
  name: string;
  title: string;
  type: string;
  shortTitle: string;
}

export interface CubeDimension extends CubeMember {
  type: 'dimension';
}

export interface CubeMeasure extends CubeMember {
  type: 'measure';
}

export interface CubeSegment extends CubeMember {
  type: 'segment';
}

export interface CubeTimeDimension extends CubeMember {
  type: 'time';
}

export interface CubeMetadata {
  cubes: {
    name: string;
    title: string;
    description?: string;
    measures: CubeMeasure[];
    dimensions: CubeDimension[];
    segments: CubeSegment[];
    isVisible: boolean;
  }[];
}

export type ChartType = 'kpi' | 'line' | 'bar' | 'pie' | 'table';

export interface Widget {
  id: string;
  title: string;
  chartType: ChartType;
  cubeName: string;
  measures: string[];
  dimensions: string[];
  filters: Array<{
    member: string;
    operator: string;
    values: string[];
  }>;
  segments: string[];
}

export interface Metric {
  id: string;
  name: string;
  description: string;
  entityType: string; // Applications, Identities, Accounts, etc.
  filters: Array<{
    member: string;
    operator: string;
    values: string[];
  }>;
  visibleColumns: string[]; // Columns to display in the Results Preview
  createdAt: string;
  updatedAt: string;
  trendData?: {
    value: number;
    change: number;
    changePercentage: number;
    period: 'day' | 'week' | 'month';
  };
}

export async function fetchCubeMetadata(): Promise<CubeMetadata> {
  return (await cubejsApi.meta()) as unknown as CubeMetadata;
}

export interface FilterType {
  member: string;
  operator: string;
  values: string[];
}

export async function queryCubeData(
  measures: string[] = [],
  dimensions: string[] = [],
  filters: FilterType[] = [],
  limit = 10000
) {
  // Use type assertion to handle complex types from Cube.js API
  const query = {
    measures,
    dimensions,
    filters,
    limit,
  };

  const resultSet = await cubejsApi.load(query as any);
  return resultSet.tablePivot();
}

export async function fetchPreviewData(
  cubeName: string,
  visibleColumns: string[] = [],
  filters: FilterType[] = [],
  limit = 5
) {
  try {
    const dimensions = visibleColumns.filter(
      (col) => !col.includes('measures')
    );
    const measures = visibleColumns.filter((col) => col.includes('measures'));

    // If no specific columns are selected, use count measure
    if (visibleColumns.length === 0) {
      measures.push(`${cubeName}.count`);
      // Add some default dimensions if available from metadata
      const meta = await fetchCubeMetadata();
      const cube = meta.cubes.find((c) => c.name === cubeName);
      if (cube && cube.dimensions.length > 0) {
        // Add up to 3 dimensions for preview
        cube.dimensions.slice(0, 3).forEach((dim) => {
          dimensions.push(`${cubeName}.${dim.name}`);
        });
      }
    }

    // Use type assertion to handle complex types from Cube.js API
    const query = {
      measures: measures.length > 0 ? measures : [`${cubeName}.count`],
      dimensions,
      filters,
      limit,
    };

    try {
      // Type assertion with unknown as intermediate step to avoid direct any
      const resultSet = await cubejsApi.load(
        query as unknown as Parameters<typeof cubejsApi.load>[0]
      );
      const data = resultSet.tablePivot();
      return data.length > 0 ? data : [{[`${cubeName}.count`]: 0}];
    } catch (error) {
      console.error('Error loading cube data:', error);
      // Return a default result with count = 0
      return [{[`${cubeName}.count`]: 0}];
    }
  } catch (error) {
    console.error('Error fetching preview data:', error);
    // Return a default result with count = 0
    return [{[`${cubeName}.count`]: 0}];
  }
}
