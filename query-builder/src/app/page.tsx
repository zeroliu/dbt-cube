'use client';

import ChatAgent from '@/components/chat/chat-agent';

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <div className="container mx-auto px-4 py-8 flex-1 overflow-hidden">
        <h1 className="text-3xl font-bold mb-4">Data Insights Explorer</h1>
        <p className="text-gray-500 mb-8">
          Ask questions about your data and get instant insights
        </p>
        <ChatAgent />
      </div>
    </div>
  );
}
