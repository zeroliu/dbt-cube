import React, {useState, useEffect} from 'react';
import {v4 as uuidv4} from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  fetchCubeMetadata,
  Widget,
  ChartType,
  CubeMetadata,
} from '@/lib/cube-client';

interface WidgetBuilderProps {
  onWidgetCreate: (widget: Widget) => void;
}

export default function WidgetBuilder({onWidgetCreate}: WidgetBuilderProps) {
  const [open, setOpen] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('kpi');
  const [cubeMetadata, setCubeMetadata] = useState<CubeMetadata | null>(null);
  const [selectedCube, setSelectedCube] = useState('');
  const [selectedMeasures, setSelectedMeasures] = useState<string[]>([]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<
    Array<{
      member: string;
      operator: string;
      values: string[];
    }>
  >([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    async function loadMetadata() {
      try {
        const metadata = await fetchCubeMetadata();
        setCubeMetadata(metadata);
      } catch (error) {
        console.error('Failed to fetch cube metadata', error);
      }
    }
    loadMetadata();
  }, []);

  // Strip cube name from titles (e.g., "Domain Applications Count" -> "Count")
  const stripCubeTitle = (title: string, cubeName: string): string => {
    // Find the cube title to remove from the measure/dimension title
    const cubeTitle =
      cubeMetadata?.cubes.find((cube) => cube.name === cubeName)?.title || '';

    // Remove the cube title prefix from the measure/dimension title
    if (cubeTitle && title.startsWith(cubeTitle)) {
      return title.substring(cubeTitle.length).trim();
    }

    return title;
  };

  const handleCreateWidget = () => {
    if (!selectedCube || !chartType || !title) return;

    const widget: Widget = {
      id: uuidv4(),
      title,
      chartType,
      cubeName: selectedCube,
      measures: selectedMeasures,
      dimensions: selectedDimensions,
      filters: selectedFilters,
      segments: selectedSegments,
    };

    onWidgetCreate(widget);
    resetForm();
    setOpen(false);
  };

  const resetForm = () => {
    setChartType('kpi');
    setSelectedCube('');
    setSelectedMeasures([]);
    setSelectedDimensions([]);
    setSelectedSegments([]);
    setSelectedFilters([]);
    setTitle('');
  };

  const handleSelectCube = (cube: string) => {
    setSelectedCube(cube);
    setSelectedMeasures([]);
    setSelectedDimensions([]);
    setSelectedSegments([]);
    setSelectedFilters([]);
  };

  const handleSelectMeasure = (measure: string) => {
    if (selectedMeasures.includes(measure)) {
      setSelectedMeasures(selectedMeasures.filter((m) => m !== measure));
    } else {
      setSelectedMeasures([...selectedMeasures, measure]);
    }
  };

  const handleSelectDimension = (dimension: string) => {
    if (selectedDimensions.includes(dimension)) {
      setSelectedDimensions(selectedDimensions.filter((d) => d !== dimension));
    } else {
      setSelectedDimensions([...selectedDimensions, dimension]);
    }
  };

  const handleSelectSegment = (segment: string) => {
    if (selectedSegments.includes(segment)) {
      setSelectedSegments(selectedSegments.filter((s) => s !== segment));
    } else {
      setSelectedSegments([...selectedSegments, segment]);
    }
  };

  const handleAddFilter = (member: string) => {
    setSelectedFilters([
      ...selectedFilters,
      {
        member,
        operator: 'equals',
        values: [],
      },
    ]);
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = [...selectedFilters];
    newFilters.splice(index, 1);
    setSelectedFilters(newFilters);
  };

  const handleUpdateFilterOperator = (index: number, operator: string) => {
    const newFilters = [...selectedFilters];
    newFilters[index].operator = operator;
    setSelectedFilters(newFilters);
  };

  const handleUpdateFilterValues = (index: number, values: string[]) => {
    const newFilters = [...selectedFilters];
    newFilters[index].values = values;
    setSelectedFilters(newFilters);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Widget</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a New Widget</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="title" className="text-sm font-medium">
              Widget Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              placeholder="Enter widget title"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="chart-type" className="text-sm font-medium">
              Chart Type
            </label>
            <Select
              value={chartType}
              onValueChange={(value: ChartType) => setChartType(value)}>
              <SelectTrigger id="chart-type">
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kpi">KPI</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
                <SelectItem value="table">Table</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="data-source" className="text-sm font-medium">
              Data Source
            </label>
            <Select value={selectedCube} onValueChange={handleSelectCube}>
              <SelectTrigger id="data-source">
                <SelectValue placeholder="Select data source" />
              </SelectTrigger>
              <SelectContent>
                {cubeMetadata?.cubes.map((cube) => (
                  <SelectItem key={cube.name} value={cube.name}>
                    {cube.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCube && (
            <>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Measures</label>
                <div className="flex flex-wrap gap-2 border rounded-md p-2 max-h-[200px] overflow-y-auto">
                  {cubeMetadata?.cubes
                    .find((cube) => cube.name === selectedCube)
                    ?.measures.map((measure) => (
                      <div
                        key={measure.name}
                        className={`cursor-pointer rounded-full px-3 py-1 text-xs ${
                          selectedMeasures.includes(measure.name)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                        onClick={() => handleSelectMeasure(measure.name)}>
                        {stripCubeTitle(measure.title, selectedCube)}
                      </div>
                    ))}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Dimensions</label>
                <div className="flex flex-wrap gap-2 border rounded-md p-2 max-h-[200px] overflow-y-auto">
                  {cubeMetadata?.cubes
                    .find((cube) => cube.name === selectedCube)
                    ?.dimensions.map((dimension) => (
                      <div
                        key={dimension.name}
                        className={`cursor-pointer rounded-full px-3 py-1 text-xs ${
                          selectedDimensions.includes(dimension.name)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                        onClick={() => handleSelectDimension(dimension.name)}>
                        {stripCubeTitle(dimension.title, selectedCube)}
                      </div>
                    ))}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Segments</label>
                <div className="flex flex-wrap gap-2 border rounded-md p-2 max-h-[200px] overflow-y-auto">
                  {cubeMetadata?.cubes
                    .find((cube) => cube.name === selectedCube)
                    ?.segments.map((segment) => (
                      <div
                        key={segment.name}
                        className={`cursor-pointer rounded-full px-3 py-1 text-xs ${
                          selectedSegments.includes(segment.name)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground'
                        }`}
                        onClick={() => handleSelectSegment(segment.name)}>
                        {stripCubeTitle(segment.title, selectedCube)}
                      </div>
                    ))}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Filters</label>
                <div className="border rounded-md p-2 max-h-[200px] overflow-y-auto">
                  {selectedFilters.map((filter, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <div className="bg-secondary rounded-md px-2 py-1 text-xs">
                        {stripCubeTitle(
                          cubeMetadata?.cubes
                            .find((cube) => cube.name === selectedCube)
                            ?.dimensions.find((d) => d.name === filter.member)
                            ?.title ||
                            cubeMetadata?.cubes
                              .find((cube) => cube.name === selectedCube)
                              ?.measures.find((m) => m.name === filter.member)
                              ?.title ||
                            filter.member,
                          selectedCube
                        )}
                      </div>
                      <Select
                        value={filter.operator}
                        onValueChange={(value) =>
                          handleUpdateFilterOperator(index, value)
                        }>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Operator" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">equals</SelectItem>
                          <SelectItem value="notEquals">not equals</SelectItem>
                          <SelectItem value="contains">contains</SelectItem>
                          <SelectItem value="gt">greater than</SelectItem>
                          <SelectItem value="lt">less than</SelectItem>
                        </SelectContent>
                      </Select>
                      <input
                        className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background"
                        placeholder="Value"
                        value={filter.values.join(',')}
                        onChange={(e) =>
                          handleUpdateFilterValues(
                            index,
                            e.target.value.split(',')
                          )
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFilter(index)}>
                        ✕
                      </Button>
                    </div>
                  ))}
                  <div className="mt-2">
                    <p className="text-xs mb-1">Add filter by:</p>
                    <div className="flex flex-wrap gap-1">
                      {cubeMetadata?.cubes
                        .find((cube) => cube.name === selectedCube)
                        ?.dimensions.map((dimension) => (
                          <div
                            key={dimension.name}
                            className="cursor-pointer rounded-full bg-secondary text-secondary-foreground px-2 py-1 text-xs"
                            onClick={() => handleAddFilter(dimension.name)}>
                            {stripCubeTitle(dimension.title, selectedCube)}
                          </div>
                        ))}
                      {cubeMetadata?.cubes
                        .find((cube) => cube.name === selectedCube)
                        ?.measures.map((measure) => (
                          <div
                            key={measure.name}
                            className="cursor-pointer rounded-full bg-secondary text-secondary-foreground px-2 py-1 text-xs"
                            onClick={() => handleAddFilter(measure.name)}>
                            {stripCubeTitle(measure.title, selectedCube)}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateWidget}
            disabled={
              !selectedCube ||
              !chartType ||
              !title ||
              selectedMeasures.length === 0 ||
              (chartType !== 'kpi' && selectedDimensions.length === 0)
            }>
            Create Widget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
