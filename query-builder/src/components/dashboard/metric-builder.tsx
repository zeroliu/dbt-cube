'use client';

import {useState, useEffect, ChangeEvent, useMemo} from 'react';
import {useRouter} from 'next/navigation';
import {v4 as uuidv4} from 'uuid';
import {useCubeQuery} from '@cubejs-client/react';
import {
  MetricConfig,
  fetchCubeMetadata,
  CubeMetadata,
  MetricValue,
} from '@/lib/cube-client';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {Loader2, Plus, X, ArrowUpRight, ArrowDownRight} from 'lucide-react';

interface MetricBuilderProps {
  initialMetric?: MetricConfig;
  onSave?: (metric: MetricConfig) => void;
}

type TableDataType = Record<string, string | number | boolean>;

export default function MetricBuilder({
  initialMetric,
  onSave,
}: MetricBuilderProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cubeMetadata, setCubeMetadata] = useState<CubeMetadata | null>(null);
  const [resultsPreview, setResultsPreview] = useState<TableDataType[]>([]);
  const [trendData, setTrendData] = useState<MetricValue | null>(null);

  // Form state
  const [metric, setMetric] = useState<MetricConfig>(
    initialMetric ||
      ({
        id: uuidv4(),
        name: '',
        description: '',
        entityType: '',
        filters: [],
        visibleColumns: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        trendData: {
          value: 0,
          previousValue: null,
          change: 0,
          changePercentage: 0,
          period: 'week',
        },
      } as MetricConfig)
  );

  // Build Cube.js query based on current metric configuration
  const cubeQuery = useMemo(() => {
    if (!metric.entityType) {
      return null;
    }

    return {
      measures: [
        `${metric.entityType}.currentCount`,
        `${metric.entityType}.lastWeekCount`,
      ],
      dimensions: [],
      filters: metric.filters.map(
        (filter: {member: string; operator: string; values: string[]}) => ({
          member: filter.member,
          operator: filter.operator,
          values: filter.values,
        })
      ),
      limit: 1,
    };
  }, [metric]);

  // Build preview query with all visible dimensions and same filters
  const buildPreviewQuery = useMemo(() => {
    if (!metric.entityType || !cubeMetadata) {
      return null;
    }

    const cube = cubeMetadata.cubes.find(
      (cube) => cube.name === metric.entityType
    );
    if (!cube) return null;

    // Use selected visible columns if any, otherwise use all dimensions
    const dimensions =
      metric.visibleColumns.length > 0
        ? metric.visibleColumns
        : cube.dimensions.map((d) => d.name);

    return {
      dimensions,
      filters: [
        {
          member: `${metric.entityType}.isCurrent`,
          operator: 'equals',
          values: ['1'],
        },
        ...metric.filters.map(
          (filter: {member: string; operator: string; values: string[]}) => ({
            member: filter.member,
            operator: filter.operator,
            values: filter.values,
          })
        ),
      ],
      limit: 5,
    };
  }, [metric, cubeMetadata]);

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

  // Load cube metadata on mount
  useEffect(() => {
    async function loadMetadata() {
      try {
        setIsLoading(true);
        const metadata = await fetchCubeMetadata();
        setCubeMetadata(metadata);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch cube metadata', error);
        setIsLoading(false);
      }
    }
    loadMetadata();
  }, []);

  // Process query results when available
  useEffect(() => {
    if (!resultSet) return;

    try {
      const tableData = resultSet.tablePivot();

      // Extract metric value (e.g., count measure)
      if (tableData.length > 0) {
        const countMeasure = `${metric.entityType}.currentCount`;
        const lastWeekCountMeasure = `${metric.entityType}.lastWeekCount`;
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
          currentValue = 0;
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
  }, [resultSet, metric.entityType]);

  // Process preview results when available
  useEffect(() => {
    if (!previewResultSet) return;

    try {
      const previewData = previewResultSet.tablePivot();
      setResultsPreview(previewData);
    } catch (error) {
      console.error('Failed to process preview data', error);
      setResultsPreview([]);
    }
  }, [previewResultSet]);

  const handleAddFilter = () => {
    setMetric({
      ...metric,
      filters: [
        ...metric.filters,
        {member: '', operator: 'equals', values: ['']},
      ],
    });
  };

  const handleRemoveFilter = (index: number) => {
    const updatedFilters = [...metric.filters];
    updatedFilters.splice(index, 1);
    setMetric({
      ...metric,
      filters: updatedFilters,
    });
  };

  const handleFilterChange = (
    index: number,
    field: string,
    value: string | string[]
  ) => {
    const updatedFilters = [...metric.filters];
    updatedFilters[index] = {
      ...updatedFilters[index],
      [field]:
        field === 'values' ? (Array.isArray(value) ? value : [value]) : value,
    };
    setMetric({
      ...metric,
      filters: updatedFilters,
    });
  };

  const handleToggleColumn = (column: string) => {
    const updatedColumns = metric.visibleColumns.includes(column)
      ? metric.visibleColumns.filter((col: string) => col !== column)
      : [...metric.visibleColumns, column];

    setMetric({
      ...metric,
      visibleColumns: updatedColumns,
    });
  };

  const handleSave = () => {
    // Update timestamps
    const updatedMetric: MetricConfig = {
      ...metric,
      updatedAt: new Date().toISOString(),
    };

    // Store the trend data in localStorage separately
    const metricWithTrendData = {
      ...updatedMetric,
      trendData: trendData || {
        value: 0,
        previousValue: null,
        change: 0,
        changePercentage: 0,
        period: 'week',
      },
    };

    // Save to localStorage
    const savedMetrics = localStorage.getItem('metrics');
    let metrics: MetricConfig[] = [];

    if (savedMetrics) {
      metrics = JSON.parse(savedMetrics);
      const existingIndex = metrics.findIndex((m) => m.id === updatedMetric.id);

      if (existingIndex >= 0) {
        metrics[existingIndex] = metricWithTrendData;
      } else {
        metrics.push(metricWithTrendData);
      }
    } else {
      metrics = [metricWithTrendData];
    }

    localStorage.setItem('metrics', JSON.stringify(metrics));

    // Call onSave callback if provided
    if (onSave) {
      onSave(updatedMetric);
    } else {
      // Navigate back to metrics list
      router.push('/metrics');
    }
  };

  // Get available columns for the selected entity type
  const getAvailableColumns = () => {
    if (!cubeMetadata || !metric.entityType) return [];

    const cube = cubeMetadata.cubes.find(
      (cube) => cube.name === metric.entityType
    );
    if (!cube) return [];

    return [
      ...cube.dimensions.map((d) => d.name),
      ...cube.measures.map((m) => m.name),
    ];
  };

  if (isLoading && !cubeMetadata) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading metadata...</span>
      </div>
    );
  }

  const visibleCubes = cubeMetadata?.cubes.filter((cube) => cube.isVisible);

  return (
    <div className="container mx-auto px-4 py-8 grid grid-cols-12 gap-6">
      {/* First row: Define Your Metric and Metric Preview */}
      <div className="col-span-8">
        <Card>
          <CardHeader>
            <CardTitle>Define Your Metric</CardTitle>
            <CardDescription>
              Configure your metric&apos;s basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Metric Name</Label>
              <Input
                id="name"
                value={metric.name}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setMetric({...metric, name: e.target.value})
                }
                placeholder="Enter a descriptive name for your metric"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={metric.description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setMetric({...metric, description: e.target.value})
                }
                placeholder="Explain what this metric measures and how it should be used"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entityType">Entity Type</Label>
              <Select
                value={metric.entityType}
                onValueChange={(value) => {
                  // Find the selected cube
                  const selectedCube = cubeMetadata?.cubes.find(
                    (cube) => cube.name === value
                  );
                  // Get all dimensions for the selected entity type
                  const allDimensions = selectedCube
                    ? selectedCube.dimensions.map((d) => d.name)
                    : [];

                  setMetric({
                    ...metric,
                    entityType: value,
                    filters: [],
                    visibleColumns: allDimensions,
                  });
                }}>
                <SelectTrigger id="entityType">
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  {visibleCubes?.map((cube) => (
                    <SelectItem key={cube.name} value={cube.name}>
                      {cube.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Metric Preview</CardTitle>
            <CardDescription>Current value and trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center p-6">
              <div className="text-5xl font-bold mb-4">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                ) : (
                  trendData?.value || '0'
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
      </div>

      {/* Second row: Filters and Results Preview */}
      <div className="col-span-12">
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Define the criteria for entities to be included in this metric
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {metric.filters.map(
              (
                filter: {member: string; operator: string; values: string[]},
                index: number
              ) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="grid grid-cols-3 gap-2 flex-1">
                    <Select
                      value={filter.member}
                      onValueChange={(value) =>
                        handleFilterChange(index, 'member', value)
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {visibleCubes?.map((cube) => (
                          <SelectGroup key={cube.name}>
                            <SelectLabel>{cube.title}</SelectLabel>
                            {cube.dimensions.map((dimension) => (
                              <SelectItem
                                key={dimension.name}
                                value={dimension.name}>
                                {dimension.title}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filter.operator}
                      onValueChange={(value) =>
                        handleFilterChange(index, 'operator', value)
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select operator" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="notEquals">Not Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="gt">Greater Than</SelectItem>
                        <SelectItem value="lt">Less Than</SelectItem>
                        <SelectItem value="gte">
                          Greater Than or Equal
                        </SelectItem>
                        <SelectItem value="lte">Less Than or Equal</SelectItem>
                        <SelectItem value="set">Is Set</SelectItem>
                        <SelectItem value="notSet">Is Not Set</SelectItem>
                        <SelectItem value="beforeDate">Before Date</SelectItem>
                        <SelectItem value="afterDate">After Date</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      value={filter.values[0] || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleFilterChange(index, 'values', [e.target.value])
                      }
                      placeholder="Value"
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFilter(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddFilter}
              className="mt-2">
              <Plus className="h-4 w-4 mr-2" /> Add Filter
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-12">
        <Card>
          <CardHeader>
            <CardTitle>Results Preview</CardTitle>
            <CardDescription>
              Sample of entities matching your criteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cubeQueryLoading || previewLoading ? (
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
                {metric.entityType && metric.filters.length > 0
                  ? 'No results match your criteria'
                  : 'Select an entity type and add filters to see results'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visible Columns section */}
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>Visible Columns</CardTitle>
          <CardDescription>
            Select which columns should appear in the results table
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {getAvailableColumns().map((column) => {
              const isSelected = metric.visibleColumns.includes(column);
              return (
                <div
                  key={column}
                  className={`p-2 border rounded cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleToggleColumn(column)}>
                  {column.split('.')[1]}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="col-span-12 mt-8 flex justify-end">
        <Button
          variant="outline"
          className="mr-2"
          onClick={() => router.push('/metrics')}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!metric.name || !metric.entityType}>
          Save Metric
        </Button>
      </div>
    </div>
  );
}
