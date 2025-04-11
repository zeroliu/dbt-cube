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
  }[];
}

export type ChartType = 'kpi' | 'line' | 'bar' | 'pie';

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
}

export async function fetchCubeMetadata(): Promise<CubeMetadata> {
  return await cubejsApi.meta();
}
