import React from 'react';
import {Widget} from '@/lib/cube-client';
import KpiChart from './charts/kpi-chart';
import LineChart from './charts/line-chart';
import BarChart from './charts/bar-chart';
import PieChart from './charts/pie-chart';

interface WidgetRendererProps {
  widget: Widget;
  onRemove: (id: string) => void;
}

export default function WidgetRenderer({
  widget,
  onRemove,
}: WidgetRendererProps) {
  const renderChart = () => {
    const {chartType, measures, dimensions, title} = widget;

    switch (chartType) {
      case 'kpi':
        return <KpiChart measure={measures[0]} title={title} />;
      case 'line':
        return (
          <LineChart
            measures={measures}
            dimension={dimensions[0]}
            title={title}
          />
        );
      case 'bar':
        return (
          <BarChart
            measures={measures}
            dimension={dimensions[0]}
            title={title}
          />
        );
      case 'pie':
        return (
          <PieChart
            measure={measures[0]}
            dimension={dimensions[0]}
            title={title}
          />
        );
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="relative">
      {renderChart()}
      <button
        onClick={() => onRemove(widget.id)}
        className="absolute top-2 right-2 rounded-full h-6 w-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700"
        aria-label="Remove widget">
        ×
      </button>
    </div>
  );
}
