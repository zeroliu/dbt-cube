'use client';

import {useState, useEffect} from 'react';
import {Widget, fetchCubeMetadata, CubeMetadata} from '@/lib/cube-client';
import WidgetBuilder from '@/components/dashboard/widget-builder';
import WidgetRenderer from '@/components/dashboard/widget-renderer';
import WidgetEditor from '@/components/dashboard/widget-editor';
import AIChartGenerator from '@/components/dashboard/ai-chart-generator';
import {cubejsApi} from '@/lib/cube-client';
import {CubeProvider} from '@cubejs-client/react';

export default function Home() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [cubeMetadata, setCubeMetadata] = useState<CubeMetadata | null>(null);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Load cube metadata on mount
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

  // Load widgets from localStorage on mount
  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboard-widgets');
    if (savedWidgets) {
      try {
        setWidgets(JSON.parse(savedWidgets));
      } catch (e) {
        console.error('Failed to parse saved widgets:', e);
      }
    }
  }, []);

  // Save widgets to localStorage when updated
  useEffect(() => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
  }, [widgets]);

  const handleAddWidget = (widget: Widget) => {
    setWidgets([...widgets, widget]);
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(widgets.filter((widget) => widget.id !== id));
  };

  const handleEditWidget = (widget: Widget) => {
    setEditingWidget(widget);
    setIsEditorOpen(true);
  };

  const handleUpdateWidget = (updatedWidget: Widget) => {
    setWidgets(
      widgets.map((widget) =>
        widget.id === updatedWidget.id ? updatedWidget : widget
      )
    );
    setEditingWidget(null);
  };

  return (
    <CubeProvider cubeApi={cubejsApi}>
      <div className="min-h-screen p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500">Create and customize your insights</p>
        </header>

        <div className="mb-6 flex gap-3">
          <WidgetBuilder onWidgetCreate={handleAddWidget} />
          {cubeMetadata && (
            <AIChartGenerator
              cubeMetadata={cubeMetadata}
              onWidgetCreate={handleAddWidget}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget) => (
            <WidgetRenderer
              key={widget.id}
              widget={widget}
              onRemove={handleRemoveWidget}
              onEdit={handleEditWidget}
            />
          ))}
          {widgets.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-10 border rounded-md border-dashed text-center">
              <p className="text-lg font-medium mb-2">
                Your dashboard is empty
              </p>
              <p className="text-gray-500 mb-4">
                Click the &quot;Add Widget&quot; button to create your first
                visualization or ask AI to generate charts for you
              </p>
            </div>
          )}
        </div>

        {editingWidget && (
          <WidgetEditor
            widget={editingWidget}
            open={isEditorOpen}
            onOpenChange={setIsEditorOpen}
            onWidgetUpdate={handleUpdateWidget}
          />
        )}
      </div>
    </CubeProvider>
  );
}
