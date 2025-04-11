import React from 'react';
import {useCubeQuery} from '@cubejs-client/react';
import {cubejsApi} from '@/lib/cube-client';

interface KpiChartProps {
  measure: string;
  title: string;
}

export default function KpiChart({measure, title}: KpiChartProps) {
  const {resultSet, isLoading, error} = useCubeQuery(
    {
      measures: [measure],
      timeDimensions: [],
      order: {},
      dimensions: [],
      filters: [],
    },
    {cubeApi: cubejsApi}
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[120px] w-full rounded-md border p-4">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[120px] w-full rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        Error: {error.toString()}
      </div>
    );
  }

  if (!resultSet) {
    return null;
  }

  const value = resultSet.tablePivot()[0]?.[measure] || 0;
  const formattedValue =
    typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <div className="flex flex-col items-center justify-center h-[120px] w-full rounded-md border p-4">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-3xl font-bold">{formattedValue}</p>
    </div>
  );
}
