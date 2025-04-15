import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {Widget, CubeMetadata} from '@/lib/cube-client';
import {
  ChartSuggestion,
  generateChartSuggestions,
  AIServiceError,
} from '@/lib/ai-service';
import WidgetRenderer from './widget-renderer';

interface AIChartGeneratorProps {
  cubeMetadata: CubeMetadata | null;
  onWidgetCreate: (widget: Widget) => void;
}

export default function AIChartGenerator({
  cubeMetadata,
  onWidgetCreate,
}: AIChartGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ChartSuggestion[]>([]);
  const [error, setError] = useState<AIServiceError | null>(null);

  const handleQuerySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!query.trim() || !cubeMetadata) return;

    setIsLoading(true);
    setSuggestions([]);
    setError(null);

    try {
      const results = await generateChartSuggestions(query, cubeMetadata);
      setSuggestions(results);
    } catch (err) {
      console.error('Error generating chart suggestions:', err);
      setError(err as AIServiceError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWidget = (widget: Widget) => {
    onWidgetCreate(widget);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <span className="i-lucide-sparkles size-4" aria-hidden="true" />
          Ask AI
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ask AI to create charts</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleQuerySubmit} className="py-4">
          <div className="flex items-center gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g., Show me revenue trends over time"
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !query.trim()}>
              {isLoading ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </form>

        {isLoading && (
          <div className="flex justify-center py-8">
            <div className="i-lucide-loader-2 size-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
            <div className="flex items-start">
              <div className="i-lucide-alert-circle size-5 text-red-500 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-semibold text-red-800">
                  {error.message}
                </h4>
                {error.details && (
                  <p className="text-sm text-red-700 mt-1">{error.details}</p>
                )}
                {error.code === 'missing_api_key' && (
                  <p className="text-sm mt-2">
                    To use the AI chart generator, you need to set up an OpenAI
                    API key in your .env.local file.
                    <br />
                    See the README for instructions.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && suggestions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="i-lucide-brain size-12 mx-auto mb-2 opacity-50" />
            <p>Ask me to create charts based on your data.</p>
            <p className="text-sm">
              Try asking for trends, comparisons, or specific metrics.
            </p>
          </div>
        )}

        {!isLoading && suggestions.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Generated Charts</h3>

            <div className="grid gap-6">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.widget.id}
                  className="border rounded-lg overflow-hidden">
                  <div className="relative p-4 bg-gray-50">
                    <div className="mb-2">{suggestion.explanation}</div>
                    <WidgetRenderer
                      widget={suggestion.widget}
                      onRemove={() => {}}
                    />
                  </div>
                  <div className="p-3 flex justify-end bg-white border-t">
                    <Button
                      size="sm"
                      onClick={() => handleAddWidget(suggestion.widget)}>
                      Add to Dashboard
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
