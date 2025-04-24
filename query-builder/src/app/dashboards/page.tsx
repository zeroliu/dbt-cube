'use client';

import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {LayoutDashboard, Plus} from 'lucide-react';

export default function DashboardsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboards</h1>
          <p className="text-gray-500">
            Create and manage dashboards using your metrics
          </p>
        </div>
        <Link href="/dashboards/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center p-12 border rounded-md border-dashed text-center">
        <LayoutDashboard className="h-16 w-16 text-gray-300 mb-4" />
        <p className="text-lg font-medium mb-2">Create your first dashboard</p>
        <p className="text-gray-500 mb-6 max-w-md">
          Dashboards allow you to combine multiple metrics into a single view
          for monitoring and analysis
        </p>
        <Link href="/dashboards/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Dashboard
          </Button>
        </Link>
        <p className="mt-8 text-sm text-gray-400">
          First, create metrics in the Metrics section, then combine them into a
          dashboard
        </p>
        <Link href="/metrics" className="text-blue-500 hover:underline mt-2">
          Go to Metrics
        </Link>
      </div>
    </div>
  );
}
