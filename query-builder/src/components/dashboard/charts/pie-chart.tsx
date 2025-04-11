import React from 'react';
import {useCubeQuery} from '@cubejs-client/react';
import {cubejsApi} from '@/lib/cube-client';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PieChartProps {
  measure: string;
  dimension: string;
  title: string;
}

const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff8042',
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
];

export default function PieChart({measure, dimension, title}: PieChartProps) {
  const {resultSet, isLoading, error} = useCubeQuery(
    {
      measures: [measure],
      timeDimensions: [],
      order: {},
      dimensions: [dimension],
      filters: [],
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

  const data = resultSet.tablePivot().map((row) => ({
    name: row[dimension],
    value: row[measure],
  }));

  return (
    <div className="w-full h-[300px] rounded-md border p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="90%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({name, percent}) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
