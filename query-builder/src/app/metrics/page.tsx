'use client';

import {useState, useEffect} from 'react';
import Link from 'next/link';
import {Metric} from '@/lib/cube-client';
import {Button} from '@/components/ui/button';
import {ArrowUpRight, ArrowDownRight, Pencil, Trash2, Bell} from 'lucide-react';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metric[]>([]);

  // Load metrics from localStorage on mount
  useEffect(() => {
    const savedMetrics = localStorage.getItem('metrics');
    if (savedMetrics) {
      try {
        setMetrics(JSON.parse(savedMetrics));
      } catch (e) {
        console.error('Failed to parse saved metrics:', e);
      }
    } else {
      // Initialize with some sample data if no metrics are saved
      const demoMetrics: Metric[] = [
        {
          id: '1',
          name: 'Active Applications',
          description: 'Count of all active applications in the system',
          entityType: 'Applications',
          filters: [
            {
              member: 'Applications.status',
              operator: 'equals',
              values: ['active'],
            },
          ],
          visibleColumns: [
            'Applications.id',
            'Applications.name',
            'Applications.createdAt',
          ],
          createdAt: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000
          ).toISOString(),
          updatedAt: new Date().toISOString(),
          trendData: {
            value: 245,
            change: 12,
            changePercentage: 5.1,
            period: 'week',
          },
        },
        {
          id: '2',
          name: 'Inactive Users',
          description: 'Users who have not logged in for the last 90 days',
          entityType: 'Identities',
          filters: [
            {
              member: 'Identities.lastLoginAt',
              operator: 'beforeDate',
              values: ['90d'],
            },
          ],
          visibleColumns: [
            'Identities.id',
            'Identities.email',
            'Identities.lastLoginAt',
          ],
          createdAt: new Date(
            Date.now() - 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
          updatedAt: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          trendData: {
            value: 532,
            change: -23,
            changePercentage: -4.1,
            period: 'month',
          },
        },
      ];
      setMetrics(demoMetrics);
      localStorage.setItem('metrics', JSON.stringify(demoMetrics));
    }
  }, []);

  const handleDeleteMetric = (id: string) => {
    const updatedMetrics = metrics.filter((metric) => metric.id !== id);
    setMetrics(updatedMetrics);
    localStorage.setItem('metrics', JSON.stringify(updatedMetrics));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Metrics</h1>
          <p className="text-gray-500">
            Build and manage reusable metrics for your dashboards
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/metrics/new">
            <Button>Create New Metric</Button>
          </Link>
          <Link href="/metrics/new-ai">
            <Button variant="outline">Create with AI</Button>
          </Link>
        </div>
      </div>

      {metrics.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border rounded-md border-dashed text-center">
          <p className="text-lg font-medium mb-2">No metrics created yet</p>
          <p className="text-gray-500 mb-4">
            Create your first metric to start building insights
          </p>
          <Link href="/metrics/new">
            <Button>Create New Metric</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="border rounded-lg p-5 hover:border-blue-300 transition-colors">
              <div className="flex justify-between">
                <div className="flex-1">
                  <Link href={`/metrics/${metric.id}`}>
                    <h2 className="text-xl font-semibold hover:text-blue-600 transition-colors">
                      {metric.name}
                    </h2>
                  </Link>
                  <p className="text-gray-500 mt-1">{metric.description}</p>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="inline-flex items-center bg-gray-100 px-2 py-1 rounded mr-2">
                      {metric.entityType}
                    </span>
                    <span>
                      Updated {new Date(metric.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <div className="flex items-center mb-2">
                    <div className="text-2xl font-bold mr-2">
                      {metric.trendData?.value}
                    </div>
                    <div
                      className={`flex items-center ${
                        metric.trendData?.change && metric.trendData.change >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                      {metric.trendData?.change &&
                      metric.trendData.change >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 mr-1" />
                      )}
                      <span>{metric.trendData?.changePercentage}%</span>
                    </div>
                  </div>

                  <div className="w-24 h-10 bg-gray-50 rounded">
                    {/* Placeholder for sparkline chart */}
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      Trend chart
                    </div>
                  </div>
                </div>

                <div className="ml-6 flex items-start space-x-2">
                  <Link href={`/metrics/${metric.id}/edit`}>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMetric(metric.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Bell className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
