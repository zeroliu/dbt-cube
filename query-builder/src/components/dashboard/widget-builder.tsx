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

  const handleCreateWidget = () => {
    if (!selectedCube || !chartType || !title) return;

    const widget: Widget = {
      id: uuidv4(),
      title,
      chartType,
      cubeName: selectedCube,
      measures: selectedMeasures,
      dimensions: selectedDimensions,
      filters: [],
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
    setTitle('');
  };

  const handleSelectCube = (cube: string) => {
    setSelectedCube(cube);
    setSelectedMeasures([]);
    setSelectedDimensions([]);
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Widget</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
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
                <div className="flex flex-wrap gap-2 border rounded-md p-2">
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
                        {measure.title}
                      </div>
                    ))}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Dimensions</label>
                <div className="flex flex-wrap gap-2 border rounded-md p-2">
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
                        {dimension.title}
                      </div>
                    ))}
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
