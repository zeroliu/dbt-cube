'use client';

import {useState, useEffect, useMemo} from 'react';
import {v4 as uuidv4} from 'uuid';
import {useCubeQuery} from '@cubejs-client/react';
import {fetchCubeMetadata, CubeMetadata} from '@/lib/cube-client';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Label} from '@/components/ui/label';
import {
  Loader2,
  Plus,
  X,
  Search,
  Filter,
  RefreshCw,
  Table as TableIcon,
  BarChart3,
  PieChart,
  LineChart,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Maximize,
} from 'lucide-react';
import {Checkbox} from '@/components/ui/checkbox';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';

export interface Question {
  id: string;
  title: string;
  entityType: string;
  dimensions: string[];
  measures: string[];
  filters: Array<{
    member: string;
    operator: string;
    values: string[];
  }>;
  sortBy?: {
    column: string;
    order: 'asc' | 'desc';
  };
  createdAt: string;
  updatedAt: string;
}

type TableDataType = Record<string, string | number | boolean>;

export default function QuestionBuilder() {
  const [isLoading, setIsLoading] = useState(false);
  const [cubeMetadata, setCubeMetadata] = useState<CubeMetadata | null>(null);
  const [resultsPreview, setResultsPreview] = useState<TableDataType[]>([]);
  const [activeTab, setActiveTab] = useState<string>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    dimensions: true,
    metrics: true,
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Question state
  const [question, setQuestion] = useState<Question>({
    id: uuidv4(),
    title: 'How much revenue does each referrer bring us in per week?',
    entityType: 'Orders',
    dimensions: [],
    measures: [],
    filters: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Build Cube.js query based on current question configuration
  const cubeQuery = useMemo(() => {
    if (!question.entityType) {
      return null;
    }

    return {
      measures: question.measures,
      dimensions: question.dimensions,
      filters: question.filters.map(
        (filter: {member: string; operator: string; values: string[]}) => ({
          member: filter.member,
          operator: filter.operator,
          values: filter.values,
        })
      ),
      order: question.sortBy
        ? {[question.sortBy.column]: question.sortBy.order}
        : undefined,
      limit: 100,
    };
  }, [question]);

  // Use Cube.js React hook for data fetching
  const {resultSet, isLoading: cubeQueryLoading} = useCubeQuery(
    cubeQuery || {},
    {skip: !cubeQuery}
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
      setResultsPreview(tableData);
    } catch (err) {
      console.error('Failed to process result set', err);
      setResultsPreview([]);
    }
  }, [resultSet]);

  const handleAddFilter = () => {
    setQuestion({
      ...question,
      filters: [
        ...question.filters,
        {
          member: '',
          operator: 'equals',
          values: [''],
        },
      ],
    });
    setShowFilterPanel(true);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = [...question.filters];
    newFilters.splice(index, 1);
    setQuestion({
      ...question,
      filters: newFilters,
    });
  };

  const handleFilterChange = (
    index: number,
    field: string,
    value: string | string[]
  ) => {
    const newFilters = [...question.filters];
    newFilters[index] = {
      ...newFilters[index],
      [field]: value,
    };
    setQuestion({
      ...question,
      filters: newFilters,
    });
  };

  const handleToggleDimension = (dimension: string) => {
    const newDimensions = question.dimensions.includes(dimension)
      ? question.dimensions.filter((d) => d !== dimension)
      : [...question.dimensions, dimension];
    setQuestion({
      ...question,
      dimensions: newDimensions,
    });
  };

  const handleToggleMeasure = (measure: string) => {
    const newMeasures = question.measures.includes(measure)
      ? question.measures.filter((m) => m !== measure)
      : [...question.measures, measure];
    setQuestion({
      ...question,
      measures: newMeasures,
    });
  };

  const handleSort = (column: string) => {
    if (question.sortBy?.column === column) {
      // Toggle order if already sorting by this column
      setQuestion({
        ...question,
        sortBy: {
          column,
          order: question.sortBy.order === 'asc' ? 'desc' : 'asc',
        },
      });
    } else {
      // Set new sort column with default asc order
      setQuestion({
        ...question,
        sortBy: {
          column,
          order: 'asc',
        },
      });
    }
  };

  const handleToggleSection = (section: 'dimensions' | 'metrics') => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const handleRefreshData = () => {
    if (resultsPreview.length > 0) {
      // Trigger a refetch by creating a new query that's identical
      const newQuery = {...cubeQuery};
      // Force the query to be treated as new
      newQuery.limit = newQuery.limit || 100;
    }
  };

  const availableDimensions = useMemo(() => {
    if (!cubeMetadata || !question.entityType) return [];

    const cube = cubeMetadata.cubes.find(
      (cube) => cube.name === question.entityType
    );
    if (!cube) return [];

    return cube.dimensions
      .map((d) => ({
        name: d.name,
        title: d.shortTitle || d.name.split('.').pop() || '',
      }))
      .filter(
        (d) =>
          !searchTerm ||
          d.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [cubeMetadata, question.entityType, searchTerm]);

  const availableMeasures = useMemo(() => {
    if (!cubeMetadata || !question.entityType) return [];

    const cube = cubeMetadata.cubes.find(
      (cube) => cube.name === question.entityType
    );
    if (!cube) return [];

    return cube.measures
      .map((m) => ({
        name: m.name,
        title: m.shortTitle || m.name.split('.').pop() || '',
      }))
      .filter(
        (m) =>
          !searchTerm ||
          m.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [cubeMetadata, question.entityType, searchTerm]);

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
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Left Sidebar - Dimensions and Metrics */}
      <div className="w-64 bg-slate-50 border-r overflow-y-auto flex flex-col">
        <div className="p-3 border-b">
          <Select
            value={question.entityType}
            onValueChange={(value) => {
              setQuestion({
                ...question,
                entityType: value,
                dimensions: [],
                measures: [],
                filters: [],
              });
            }}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select an entity" />
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

        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search metrics & dimensions"
              className="pl-8 bg-white text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Dimensions Section */}
          <div className="border-b">
            <button
              className="flex items-center justify-between w-full p-3 hover:bg-slate-100 text-sm font-medium"
              onClick={() => handleToggleSection('dimensions')}>
              <span>Dimensions</span>
              {expandedSections.dimensions ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {expandedSections.dimensions && (
              <div className="px-3 pb-3">
                {availableDimensions.map((dimension) => (
                  <div
                    key={dimension.name}
                    className="flex items-center space-x-2 py-1.5">
                    <Checkbox
                      id={dimension.name}
                      checked={question.dimensions.includes(dimension.name)}
                      onCheckedChange={() =>
                        handleToggleDimension(dimension.name)
                      }
                      className="rounded-sm"
                    />
                    <Label
                      htmlFor={dimension.name}
                      className="text-sm font-normal cursor-pointer">
                      {dimension.title}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metrics Section */}
          <div className="border-b">
            <button
              className="flex items-center justify-between w-full p-3 hover:bg-slate-100 text-sm font-medium"
              onClick={() => handleToggleSection('metrics')}>
              <span>Metrics</span>
              {expandedSections.metrics ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            {expandedSections.metrics && (
              <div className="px-3 pb-3">
                {availableMeasures.map((measure) => (
                  <div
                    key={measure.name}
                    className="flex items-center space-x-2 py-1.5">
                    <Checkbox
                      id={measure.name}
                      checked={question.measures.includes(measure.name)}
                      onCheckedChange={() => handleToggleMeasure(measure.name)}
                      className="rounded-sm"
                    />
                    <Label
                      htmlFor={measure.name}
                      className="text-sm font-normal cursor-pointer">
                      {measure.title}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with title and buttons */}
        <div className="bg-white p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded text-sm">
                Marketing
              </span>
              {question.title}
              {question.title && (
                <span className="text-blue-500 ml-1 cursor-pointer">✏️</span>
              )}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={
                question.dimensions.length === 0 &&
                question.measures.length === 0
              }>
              Save changes
            </Button>
            <Button variant="ghost" size="sm">
              Cancel
            </Button>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-white p-3 border-b flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh data
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex items-center ${
              showFilterPanel ? 'bg-slate-100' : ''
            }`}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center ml-auto">
            <Maximize className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters Panel (conditionally shown) */}
        {showFilterPanel && (
          <div className="bg-white p-4 border-b">
            <h2 className="text-sm font-medium mb-3">Filters</h2>

            {question.filters.length > 0 ? (
              <div className="space-y-3">
                {question.filters.map((filter, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="grid grid-cols-3 gap-2 flex-1">
                      <Select
                        value={filter.member}
                        onValueChange={(value) =>
                          handleFilterChange(index, 'member', value)
                        }>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Select field" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDimensions.map((dimension) => (
                            <SelectItem
                              key={dimension.name}
                              value={dimension.name}>
                              {dimension.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={filter.operator}
                        onValueChange={(value) =>
                          handleFilterChange(index, 'operator', value)
                        }>
                        <SelectTrigger className="text-sm">
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
                          <SelectItem value="lte">
                            Less Than or Equal
                          </SelectItem>
                          <SelectItem value="set">Is Set</SelectItem>
                          <SelectItem value="notSet">Is Not Set</SelectItem>
                          <SelectItem value="beforeDate">
                            Before Date
                          </SelectItem>
                          <SelectItem value="afterDate">After Date</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-2">
                        <Input
                          value={filter.values[0] || ''}
                          onChange={(e) =>
                            handleFilterChange(index, 'values', [
                              e.target.value,
                            ])
                          }
                          placeholder="Value"
                          className="text-sm flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFilter(index)}
                          className="p-1">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm mb-3">
                No filters applied
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddFilter}
              className="mt-2">
              <Plus className="h-4 w-4 mr-2" /> Add Filter
            </Button>
          </div>
        )}

        {/* Results Tabs */}
        <div className="flex-1 flex flex-col">
          <div className="border-b">
            <div className="px-4">
              <Tabs
                defaultValue="table"
                value={activeTab}
                onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="table" className="text-xs">
                    <TableIcon className="h-3 w-3 mr-1" />
                    Table
                  </TabsTrigger>
                  <TabsTrigger value="bar" className="text-xs">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Bar
                  </TabsTrigger>
                  <TabsTrigger value="line" className="text-xs">
                    <LineChart className="h-3 w-3 mr-1" />
                    Line
                  </TabsTrigger>
                  <TabsTrigger value="pie" className="text-xs">
                    <PieChart className="h-3 w-3 mr-1" />
                    Pie
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <Tabs value={activeTab} className="flex-1 overflow-hidden">
            <div className="p-4 h-full overflow-auto">
              <TabsContent value="table" className="mt-0 h-full">
                {cubeQueryLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : resultsPreview.length > 0 ? (
                  <div className="overflow-x-auto border rounded">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-10 border-r">
                            #
                          </th>
                          {Object.keys(resultsPreview[0]).map((key) => (
                            <th
                              key={key}
                              className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r cursor-pointer hover:bg-slate-100"
                              onClick={() => handleSort(key)}>
                              <div className="flex items-center justify-between">
                                <span>{key.split('.').pop()}</span>
                                {question.sortBy?.column === key &&
                                  (question.sortBy.order === 'asc' ? (
                                    <ChevronUp className="h-3 w-3" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3" />
                                  ))}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {resultsPreview.map((row, rowIndex) => (
                          <tr key={rowIndex} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-sm text-gray-500 border-r">
                              {rowIndex + 1}
                            </td>
                            {Object.values(row).map((value, colIndex) => (
                              <td
                                key={colIndex}
                                className="px-3 py-2 text-sm border-r whitespace-nowrap">
                                {String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {/* Total row */}
                        <tr className="bg-slate-50 font-medium">
                          <td className="px-3 py-2 text-sm border-r">Total</td>
                          {Object.keys(resultsPreview[0]).map(
                            (key, colIndex) => (
                              <td
                                key={colIndex}
                                className="px-3 py-2 text-sm border-r">
                                {colIndex ===
                                Object.keys(resultsPreview[0]).length - 1
                                  ? // Sum up the last column (assuming it's a numeric value)
                                    `$${resultsPreview
                                      .reduce((sum, row) => {
                                        const value = Number(row[key]) || 0;
                                        return sum + value;
                                      }, 0)
                                      .toLocaleString()}.00`
                                  : ''}
                              </td>
                            )
                          )}
                        </tr>
                      </tbody>
                    </table>
                    <div className="p-2 flex items-center justify-between bg-white border-t text-xs">
                      <div className="flex items-center gap-2">
                        <span>Pages</span>
                        <button className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded">
                          Scroll
                        </button>
                      </div>
                      <div>Page 1 of 50</div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    {question.dimensions.length === 0 &&
                    question.measures.length === 0
                      ? 'Select dimensions and measures to see data'
                      : 'No results match your criteria'}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="bar" className="mt-0 h-full">
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-md">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">
                      Bar chart visualization placeholder
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="line" className="mt-0 h-full">
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-md">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">
                      Line chart visualization placeholder
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pie" className="mt-0 h-full">
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-200 rounded-md">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-500">
                      Pie chart visualization placeholder
                    </p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
