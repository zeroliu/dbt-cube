'use client';

import {useState, useEffect, useMemo} from 'react';
import {useRouter, useParams} from 'next/navigation';
import Link from 'next/link';
import {Metric} from '@/lib/cube-client';
import {useCubeQuery} from '@cubejs-client/react';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {Loader2, ArrowUpRight, ArrowDownRight, Pencil} from 'lucide-react';

type ResultRowType = Record<string, string | number | boolean>;

export default function MetricDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [metric, setMetric] = useState<Metric | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resultsPreview, setResultsPreview] = useState<ResultRowType[]>([]);
  const [metricValue, setMetricValue] = useState<number | null>(null);

  // Load metric from localStorage on mount
  useEffect(() => {
    const savedMetrics = localStorage.getItem('metrics');
    if (savedMetrics) {
      try {
        const metrics = JSON.parse(savedMetrics);
        const foundMetric = metrics.find((m: Metric) => m.id === id);

        if (foundMetric) {
          setMetric(foundMetric);
        } else {
          // Metric not found, redirect to list
          router.push('/metrics');
        }
      } catch (e) {
        console.error('Failed to parse saved metrics:', e);
        router.push('/metrics');
      }
    } else {
      // No metrics found, redirect to list
      router.push('/metrics');
    }
  }, [id, router]);

  // Build Cube.js query based on metric configuration
  const cubeQuery = useMemo(() => {
    if (!metric?.entityType) {
      return null;
    }

    return {
      measures: [`${metric.entityType}.count`],
      dimensions: [],
      filters: [
        {
          member: `${metric.entityType}.isCurrent`,
          operator: 'equals',
          values: ['1'],
        },
        ...metric.filters.map((filter) => ({
          member: filter.member,
          operator: filter.operator,
          values: filter.values,
        })),
      ],
      limit: 1,
    };
  }, [metric]);

  // Build preview query with all visible dimensions and same filters
  const buildPreviewQuery = useMemo(() => {
    if (!metric?.entityType) {
      return null;
    }

    const dimensions = metric.visibleColumns.filter(
      (col) => !col.includes('measures')
    );
    const measures = metric.visibleColumns.filter((col) =>
      col.includes('measures')
    );

    return {
      dimensions,
      measures: measures.length > 0 ? measures : [`${metric.entityType}.count`],
      filters: [
        {
          member: `${metric.entityType}.isCurrent`,
          operator: 'equals',
          values: ['1'],
        },
        ...metric.filters.map((filter) => ({
          member: filter.member,
          operator: filter.operator,
          values: filter.values,
        })),
      ],
      limit: 5,
    };
  }, [metric]);

  // Use Cube.js React hook for data fetching
  const {resultSet, isLoading: cubeQueryLoading} = useCubeQuery(
    cubeQuery || {},
    {skip: !cubeQuery}
  );

  // Use a separate query for preview data
  const {resultSet: previewResultSet, isLoading: previewLoading} = useCubeQuery(
    buildPreviewQuery || {},
    {skip: !buildPreviewQuery}
  );

  // Process query results when available
  useEffect(() => {
    if (!resultSet || !metric) return;

    try {
      const tableData = resultSet.tablePivot();

      // Extract metric value (e.g., count measure)
      if (tableData.length > 0) {
        const countMeasure = `${metric.entityType}.count`;
        const countCol = Object.keys(tableData[0]).find(
          (key) => key === countMeasure
        );

        if (countCol && tableData[0][countCol]) {
          setMetricValue(Number(tableData[0][countCol]));
        } else {
          console.log('No count column found');
          setMetricValue(0);
        }
      } else {
        setMetricValue(0);
      }
    } catch (err) {
      console.error('Failed to process result set', err);
      setMetricValue(metric.trendData?.value || 0);
    }
  }, [resultSet, metric]);

  // Process preview results when available
  useEffect(() => {
    if (!previewResultSet) return;

    try {
      const previewData = previewResultSet.tablePivot();
      setResultsPreview(previewData);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to process preview data', error);
      setResultsPreview([]);
      setIsLoading(false);
    }
  }, [previewResultSet]);

  if (!metric) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading metric...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{metric.name}</h1>
          <p className="text-gray-500">{metric.description}</p>
          <div className="mt-2 text-sm text-gray-600">
            <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded mr-2">
              {metric.entityType}
            </span>
            <span>
              Updated {new Date(metric.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/metrics/${metric.id}/edit`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Metric
            </Button>
          </Link>
          <Button onClick={() => router.push('/dashboards/new')}>
            Add to Dashboard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Metric Value Card */}
        <Card>
          <CardHeader>
            <CardTitle>Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center p-6">
              <div className="text-5xl font-bold mb-4">
                {cubeQueryLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                ) : (
                  metricValue || 'N/A'
                )}
              </div>

              {metric.trendData && (
                <div
                  className={`flex items-center ${
                    metric.trendData.change >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                  {metric.trendData.change >= 0 ? (
                    <ArrowUpRight className="h-5 w-5 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 mr-1" />
                  )}
                  <span className="text-lg font-medium">
                    {metric.trendData.changePercentage}% from last{' '}
                    {metric.trendData.period}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trend Chart Card */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Historical Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-64 bg-gray-50 rounded flex items-center justify-center">
              <span className="text-gray-400">
                Trend visualization will appear here
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            Entities matching your metric criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || previewLoading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : resultsPreview.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    {Object.keys(resultsPreview[0]).map((key) => (
                      <th
                        key={key}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {key.split('.').pop()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {resultsPreview.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((value, colIndex) => (
                        <td key={colIndex} className="px-3 py-2 text-sm">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500 text-sm">
              No results match your criteria
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metric Definition */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Metric Definition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Entity Type</h3>
              <p>{metric.entityType}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Visible Columns
              </h3>
              <div className="flex flex-wrap gap-1">
                {metric.visibleColumns.map((column) => (
                  <span
                    key={column}
                    className="inline-flex items-center bg-gray-100 px-2 py-1 rounded text-sm">
                    {column.split('.')[1]}
                  </span>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <h3 className="font-medium text-gray-900 mb-2">Filters</h3>
              {metric.filters.length > 0 ? (
                <ul className="space-y-1">
                  {metric.filters.map((filter, index) => (
                    <li key={index} className="text-sm">
                      <span className="font-medium">
                        {filter.member.split('.')[1]}
                      </span>{' '}
                      <span className="text-gray-500">{filter.operator}</span>{' '}
                      <span>{filter.values.join(', ')}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">No filters defined</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
