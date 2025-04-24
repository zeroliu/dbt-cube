'use client';

import {useState, ChangeEvent} from 'react';
import {useRouter} from 'next/navigation';
import MetricBuilder from '@/components/dashboard/metric-builder';
import {Metric} from '@/lib/cube-client';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {v4 as uuidv4} from 'uuid';
import {Loader2} from 'lucide-react';

export default function NewMetricAiPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestedMetric, setSuggestedMetric] = useState<Metric | null>(null);

  const handleGenerateMetric = async () => {
    setIsProcessing(true);

    // In a real application, this would call an AI service to process the query
    // For this prototype, we'll simulate an AI response with a timeout
    setTimeout(() => {
      // Generate a sample metric based on the query
      let metricName = '';
      let description = '';
      let entityType = '';
      const filters: Array<{
        member: string;
        operator: string;
        values: string[];
      }> = [];

      // Simple logic to parse the query and generate a metric
      const lowerQuery = query.toLowerCase();

      if (lowerQuery.includes('active') && lowerQuery.includes('user')) {
        metricName = 'Active Users';
        description = 'Count of all active users in the system';
        entityType = 'Identities';
        filters.push({
          member: 'Identities.status',
          operator: 'equals',
          values: ['active'],
        });
      } else if (
        lowerQuery.includes('expensive') &&
        lowerQuery.includes('app')
      ) {
        metricName = 'Expensive Applications';
        description = 'Applications with high resource usage';
        entityType = 'Applications';
        filters.push({
          member: 'Applications.costTier',
          operator: 'equals',
          values: ['high'],
        });
      } else {
        // Default fallback
        metricName = 'Custom Metric';
        description = query;
        entityType = 'Applications';
      }

      setSuggestedMetric({
        id: uuidv4(),
        name: metricName,
        description: description,
        entityType: entityType,
        filters: filters,
        visibleColumns: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {!suggestedMetric ? (
        <div>
          <h1 className="text-3xl font-bold mb-6">Create Metric with AI</h1>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Describe Your Metric</CardTitle>
              <CardDescription>
                Use natural language to describe the metric you want to create
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g., Show active users for expensive apps"
                value={query}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setQuery(e.target.value)
                }
                className="h-32 mb-4"
              />

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="mr-2"
                  onClick={() => router.push('/metrics')}>
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateMetric}
                  disabled={!query.trim() || isProcessing}>
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Generate Metric'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {isProcessing && (
            <div className="mt-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Analyzing your request...</p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h1 className="text-3xl font-bold mb-6">
            Review & Refine Your Metric
          </h1>
          <p className="text-gray-500 mb-8">
            We&apos;ve generated a metric based on your description. You can
            review and refine it below.
          </p>

          <MetricBuilder initialMetric={suggestedMetric} />
        </div>
      )}
    </div>
  );
}
