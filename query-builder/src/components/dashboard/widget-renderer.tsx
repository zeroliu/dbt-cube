import React from 'react';
import {Widget} from '@/lib/cube-client';
import KpiChart from './charts/kpi-chart';
import LineChart from './charts/line-chart';
import BarChart from './charts/bar-chart';
import PieChart from './charts/pie-chart';

interface WidgetRendererProps {
  widget: Widget;
  onRemove: (id: string) => void;
  onEdit?: (widget: Widget) => void;
}

export default function WidgetRenderer({
  widget,
  onRemove,
  onEdit,
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
      <div className="absolute top-2 right-2 flex gap-2">
        {onEdit && (
          <button
            onClick={() => onEdit(widget)}
            className="rounded-full h-6 w-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700"
            aria-label="Edit widget">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </button>
        )}
        <button
          onClick={() => onRemove(widget.id)}
          className="rounded-full h-6 w-6 flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700"
          aria-label="Remove widget">
          ×
        </button>
      </div>
    </div>
  );
}
