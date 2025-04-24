'use client';

import {useState, useEffect} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {Metric} from '@/lib/cube-client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {Check, Plus, ArrowLeft} from 'lucide-react';

export default function NewDashboardPage() {
  const router = useRouter();
  const [dashboardName, setDashboardName] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');
  const [availableMetrics, setAvailableMetrics] = useState<Metric[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  // Load available metrics from localStorage
  useEffect(() => {
    const savedMetrics = localStorage.getItem('metrics');
    if (savedMetrics) {
      try {
        setAvailableMetrics(JSON.parse(savedMetrics));
      } catch (e) {
        console.error('Failed to parse saved metrics:', e);
      }
    }
  }, []);

  const handleMetricToggle = (metricId: string) => {
    if (selectedMetrics.includes(metricId)) {
      setSelectedMetrics(selectedMetrics.filter((id) => id !== metricId));
    } else {
      setSelectedMetrics([...selectedMetrics, metricId]);
    }
  };

  const handleCreateDashboard = () => {
    // In a real app, this would save the dashboard to a backend
    // For this prototype, we'll just simulate saving and redirect

    // Show a success message
    alert('Dashboard created successfully!');

    // Redirect to dashboards list
    router.push('/dashboards');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboards" className="flex items-center text-blue-500 mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Dashboards
      </Link>

      <h1 className="text-3xl font-bold mb-6">Create New Dashboard</h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Details</CardTitle>
              <CardDescription>
                Provide basic information about your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Dashboard Name</Label>
                <Input
                  id="name"
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                  placeholder="My Dashboard"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={dashboardDescription}
                  onChange={(e) => setDashboardDescription(e.target.value)}
                  placeholder="Dashboard description"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Metrics</CardTitle>
              <CardDescription>
                Choose metrics to display on your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableMetrics.length > 0 ? (
                <div className="space-y-3">
                  {availableMetrics.map((metric) => (
                    <div
                      key={metric.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedMetrics.includes(metric.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => handleMetricToggle(metric.id)}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{metric.name}</h3>
                          <p className="text-sm text-gray-500">
                            {metric.description}
                          </p>
                        </div>

                        {selectedMetrics.includes(metric.id) && (
                          <div className="bg-blue-500 rounded-full p-1">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No metrics available</p>
                  <Link href="/metrics/new">
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Metric
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          variant="outline"
          className="mr-2"
          onClick={() => router.push('/dashboards')}>
          Cancel
        </Button>
        <Button
          onClick={handleCreateDashboard}
          disabled={!dashboardName || selectedMetrics.length === 0}>
          Create Dashboard
        </Button>
      </div>
    </div>
  );
}
