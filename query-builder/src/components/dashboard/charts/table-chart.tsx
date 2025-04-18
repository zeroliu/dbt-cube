import React from 'react';
import {useCubeQuery} from '@cubejs-client/react';
import {cubejsApi} from '@/lib/cube-client';
import {Filter, formatFilters} from '@/lib/filter-utils';

interface TableChartProps {
  measures: string[];
  dimensions: string[];
  title: string;
  filters?: Filter[];
  segments?: string[];
}

export default function TableChart({
  measures,
  dimensions,
  title,
  filters = [],
  segments = [],
}: TableChartProps) {
  // Convert our filter format to CubeJS filter format
  const cubeFilters = formatFilters(filters);

  const {resultSet, isLoading, error} = useCubeQuery(
    {
      measures: measures,
      timeDimensions: [],
      order: {},
      dimensions: dimensions,
      filters: cubeFilters,
      segments: segments,
    },
    {cubeApi: cubejsApi}
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px] w-full rounded-md border p-4">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[300px] w-full rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
        Error: {error.toString()}
      </div>
    );
  }

  if (!resultSet) {
    return null;
  }

  const data = resultSet.tablePivot();

  // Extract all column keys from the data
  const columnKeys = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="w-full h-[300px] rounded-md border p-4 overflow-auto">
      <h3 className="text-sm font-medium text-gray-500 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columnKeys.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {column.split('.').pop()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columnKeys.map((column) => (
                  <td
                    key={`${rowIndex}-${column}`}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row[column]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
