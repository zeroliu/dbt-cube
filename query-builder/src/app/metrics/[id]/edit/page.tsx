'use client';

import {useState, useEffect} from 'react';
import {useRouter, useParams} from 'next/navigation';
import MetricBuilder from '@/components/dashboard/metric-builder';
import {MetricConfig} from '@/lib/cube-client';
import {Loader2} from 'lucide-react';

export default function EditMetricPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [metricConfig, setMetricConfig] = useState<MetricConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(false);
      } catch (e) {
        console.error('Failed to parse saved metrics:', e);
        router.push('/metrics');
      }
    } else {
      // No metrics found, redirect to list
      router.push('/metrics');
    }
  }, [id, router]);

  const handleSave = (updatedMetric: MetricConfig) => {
    // Navigate back to metric details
    router.push(`/metrics/${updatedMetric.id}`);
  };

  if (isLoading || !metricConfig) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading metric...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">
          Edit Metric: {metricConfig.name}
        </h1>
        <MetricBuilder initialMetric={metricConfig} onSave={handleSave} />
      </div>
    </div>
  );
}
