'use client';

import {useState, useEffect, useMemo} from 'react';
import {useRouter, useParams} from 'next/navigation';
import Link from 'next/link';
import {MetricConfig, MetricValue} from '@/lib/cube-client';
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

  const [metricConfig, setMetricConfig] = useState<MetricConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resultsPreview, setResultsPreview] = useState<ResultRowType[]>([]);
  const [trendData, setTrendData] = useState<MetricValue | null>(null);

  // Load metric from localStorage on mount
  useEffect(() => {
    const savedMetrics = localStorage.getItem('metrics');
    if (savedMetrics) {
      try {
        const metrics = JSON.parse(savedMetrics);
        const foundMetric = metrics.find((m: MetricConfig) => m.id === id);

        if (foundMetric) {
          setMetricConfig(foundMetric);
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
    if (!metricConfig?.entityType) {
      return null;
    }

    return {
      measures: [
        `${metricConfig.entityType}.currentCount`,
        `${metricConfig.entityType}.lastWeekCount`,
      ],
      dimensions: [],
      filters: metricConfig.filters.map((filter) => ({
        member: filter.member,
        operator: filter.operator,
        values: filter.values,
      })),
      limit: 1,
    };
  }, [metricConfig]);

  // Build preview query with all visible dimensions and same filters
  const buildPreviewQuery = useMemo(() => {
    if (!metricConfig?.entityType) {
      return null;
    }

    const dimensions = metricConfig.visibleColumns.filter(
      (col) => !col.includes('measures')
    );

    return {
      dimensions,
      measures: [],
      filters: [
        {
          member: `${metricConfig.entityType}.isCurrent`,
          operator: 'equals',
          values: ['1'],
        },
        ...metricConfig.filters.map((filter) => ({
          member: filter.member,
          operator: filter.operator,
          values: filter.values,
        })),
      ],
      limit: 5,
    };
  }, [metricConfig]);

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
    if (!resultSet || !metricConfig) return;

    try {
      const tableData = resultSet.tablePivot();

      // Extract metric value (e.g., count measure)
      if (tableData.length > 0) {
        const countMeasure = `${metricConfig.entityType}.currentCount`;
        const lastWeekCountMeasure = `${metricConfig.entityType}.lastWeekCount`;
        const countCol = Object.keys(tableData[0]).find(
          (key) => key === countMeasure
        );
        const lastWeekCountCol = Object.keys(tableData[0]).find(
          (key) => key === lastWeekCountMeasure
        );

        let currentValue: number | null = null;
        let previousValue: number | null = null;

        if (countCol && tableData[0][countCol]) {
          currentValue = Number(tableData[0][countCol]);
        } else {
          console.log('No count column found');
        }

        if (lastWeekCountCol && tableData[0][lastWeekCountCol]) {
          previousValue = Number(tableData[0][lastWeekCountCol]);
        } else {
          console.log('No last week count column found');
        }

        // Calculate trend data
        if (currentValue !== null) {
          let change = 0;
          let changePercentage = 0;

          if (previousValue !== null) {
            change = currentValue - previousValue;
            changePercentage =
              previousValue !== 0
                ? Math.round((change / previousValue) * 100)
                : 0;
          }

          setTrendData({
            value: currentValue,
            previousValue,
            change,
            changePercentage,
            period: 'week',
          });
        } else {
          setTrendData({
            value: 0,
            previousValue: null,
            change: 0,
            changePercentage: 0,
            period: 'week',
          });
        }
      } else {
        setTrendData({
          value: 0,
          previousValue: null,
          change: 0,
          changePercentage: 0,
          period: 'week',
        });
      }
    } catch (err) {
      console.error('Failed to process result set', err);
      setTrendData({
        value: 0,
        previousValue: null,
        change: 0,
        changePercentage: 0,
        period: 'week',
      });
    }
  }, [resultSet, metricConfig]);

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

  if (!metricConfig) {
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
          <h1 className="text-3xl font-bold">{metricConfig.name}</h1>
          <p className="text-gray-500">{metricConfig.description}</p>
          <div className="mt-2 text-sm text-gray-600">
            <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded mr-2">
              {metricConfig.entityType}
            </span>
            <span>
              Updated {new Date(metricConfig.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link href={`/metrics/${metricConfig.id}/edit`}>
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
                  trendData?.value || 'N/A'
                )}
              </div>

              {trendData?.previousValue !== null && trendData && (
                <div
                  className={`flex items-center ${
                    trendData.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                  {trendData.change >= 0 ? (
                    <ArrowUpRight className="h-5 w-5 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 mr-1" />
                  )}
                  <span className="text-lg font-medium">
                    {trendData.changePercentage}% ({trendData.previousValue})
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
              <p>{metricConfig.entityType}</p>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Visible Columns
              </h3>
              <div className="flex flex-wrap gap-1">
                {metricConfig.visibleColumns.map((column) => (
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
              {metricConfig.filters.length > 0 ? (
                <ul className="space-y-1">
                  {metricConfig.filters.map((filter, index) => (
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
