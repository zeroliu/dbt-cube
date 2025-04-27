'use client';

import LangGraphAgent from '@/components/chat/langgraph-agent';

export default function LangGraphPage() {
  return (
    <div className="flex flex-col h-screen">
      <div className="container mx-auto px-4 py-8 flex-1 overflow-hidden">
        <h1 className="text-3xl font-bold mb-4">Multi-Step AI Analysis</h1>
        <p className="text-gray-500 mb-8">
          This agent autonomously plans and executes a sequence of analytical
          steps, making decisions based on the data it discovers.
        </p>
        <LangGraphAgent />
      </div>
    </div>
  );
}
