import React from 'react';
import {useCubeQuery} from '@cubejs-client/react';
import {cubejsApi} from '@/lib/cube-client';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface LineChartProps {
  measures: string[];
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
];

export default function LineChart({
  measures,
  dimension,
  title,
}: LineChartProps) {
  const {resultSet, isLoading, error} = useCubeQuery(
    {
      measures: measures,
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

  const data = resultSet.tablePivot();

  return (
    <div className="w-full h-[300px] rounded-md border p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height="90%">
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={dimension}
            tick={{fontSize: 12}}
            tickFormatter={(value) => {
              return String(value).length > 20
                ? `${String(value).substring(0, 20)}...`
                : value;
            }}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          {measures.map((measure, index) => (
            <Line
              key={measure}
              type="monotone"
              dataKey={measure}
              stroke={COLORS[index % COLORS.length]}
              activeDot={{r: 8}}
              name={measure.split('.').pop()}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
