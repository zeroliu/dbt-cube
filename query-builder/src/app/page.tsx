'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the metrics page
    router.push('/metrics');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-gray-500">Redirecting to Insights...</p>
    </div>
  );
}
