'use client';

import MetricBuilder from '@/components/dashboard/metric-builder';

export default function NewMetricPage() {
  return (
    <div>
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Create New Metric</h1>
        <MetricBuilder />
      </div>
    </div>
  );
}
