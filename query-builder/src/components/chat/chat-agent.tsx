'use client';

import {useState, useEffect, useRef} from 'react';
import {fetchCubeMetadata, cubejsApi, CubeMetadata} from '@/lib/cube-client';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Loader2, Send, Save, AlertTriangle} from 'lucide-react';
import {v4 as uuidv4} from 'uuid';
import type {Query} from '@cubejs-client/core';
import ReactMarkdown from 'react-markdown';
import {
  generateQuery,
  generateInsights,
  CubeQueryPayload,
} from '@/lib/chat-service';

type MessageType = 'user' | 'system' | 'loading' | 'error';

interface InsightResult {
  text: string;
  tableData: Record<string, string | number | boolean>[];
  queryPayload: CubeQueryPayload;
}

interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  insightResult?: InsightResult;
}

export default function ChatAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      type: 'system',
      content:
        "I'm ready to help you find insights in your data. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [metadata, setMetadata] = useState<CubeMetadata | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load cube metadata on mount
  useEffect(() => {
    async function loadMetadata() {
      try {
        const metaData = await fetchCubeMetadata();
        setMetadata(metaData);

        // Check if OpenAI API key is configured
        if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
          setApiKeyMissing(true);
          addMessage(
            'error',
            'OpenAI API key is missing. Please configure it in your .env.local file.'
          );
        }
      } catch (error) {
        console.error('Failed to fetch cube metadata', error);
        addMessage(
          'error',
          'Unable to connect to your data. Please check your CubeJS server connection.'
        );
      }
    }
    loadMetadata();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  };

  const addMessage = (
    type: MessageType,
    content: string,
    insightResult?: InsightResult
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type,
        content,
        timestamp: new Date(),
        insightResult,
      },
    ]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading || !metadata) return;

    // Check for OpenAI API key
    if (apiKeyMissing) {
      addMessage(
        'error',
        'Cannot process your question. OpenAI API key is missing. Please configure it in your .env.local file.'
      );
      return;
    }

    const question = input.trim();
    addMessage('user', question);
    setInput('');
    setIsLoading(true);
    addMessage('loading', 'Analyzing your question...');

    try {
      // 1. Generate a query based on the question using the LLM
      const query = await generateQuery(question, metadata);

      if (!query) {
        addMessage(
          'error',
          "I couldn't generate a query for your question. Please try to rephrase it or be more specific."
        );
        setMessages((prev) => prev.filter((msg) => msg.type !== 'loading'));
        setIsLoading(false);
        return;
      }

      // Update loading message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === 'loading' ? {...msg, content: 'Fetching data...'} : msg
        )
      );

      // 2. Execute the query
      try {
        const resultSet = await cubejsApi.load(query as unknown as Query);
        const data = resultSet.tablePivot();

        if (data.length === 0) {
          setMessages((prev) => prev.filter((msg) => msg.type !== 'loading'));
          addMessage(
            'system',
            "I couldn't find any data matching your query. Please try a different question."
          );
          setIsLoading(false);
          return;
        }

        // Update loading message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.type === 'loading'
              ? {...msg, content: 'Generating insights...'}
              : msg
          )
        );

        // 3. Process the results using the LLM
        const insightText = await generateInsights(data, question, query);

        // Create the insight result with markdown formatting
        const insight: InsightResult = {
          text: insightText,
          tableData: data,
          queryPayload: query,
        };

        // Remove loading message and add the insight directly to the chat
        setMessages((prev) => prev.filter((msg) => msg.type !== 'loading'));
        addMessage('system', insight.text, insight);
      } catch (error) {
        console.error('Error executing CubeJS query:', error);
        setMessages((prev) => prev.filter((msg) => msg.type !== 'loading'));
        addMessage(
          'error',
          'Error executing the query. The requested data might not be available or there might be an issue with the data model.'
        );
      }
    } catch (error) {
      console.error('Error in chat processing:', error);
      setMessages((prev) => prev.filter((msg) => msg.type !== 'loading'));
      addMessage(
        'error',
        'Sorry, I encountered an error processing your query. Please try again with a different question.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInsight = (insightResult: InsightResult) => {
    if (!insightResult) return;

    // Save the insight to localStorage
    const savedItems = JSON.parse(localStorage.getItem('metrics') || '[]');
    const newMetric = {
      id: uuidv4(),
      name: `Insight: ${input || 'Data analysis'}`,
      description: insightResult.text.substring(0, 100),
      entityType:
        insightResult.queryPayload.measures[0]?.split('.')[0] || 'Unknown',
      filters: insightResult.queryPayload.filters,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      trendData: {
        value: 0,
        previousValue: 0,
        change: 0,
        changePercentage: 0,
        period: 'day',
      },
    };

    localStorage.setItem('metrics', JSON.stringify([...savedItems, newMetric]));
    addMessage(
      'system',
      "I've saved this insight to your metrics. You can view and edit it anytime."
    );
  };

  const renderTableView = (
    tableData: Record<string, string | number | boolean>[]
  ) => {
    if (!tableData || tableData.length === 0) {
      return (
        <div className="text-center text-gray-500 my-4">No data to display</div>
      );
    }

    const columns = Object.keys(tableData[0]);

    return (
      <div className="overflow-x-auto mt-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              {columns.map((col) => (
                <th key={col} className="border p-2 text-left">
                  {col.split('.').pop()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {columns.map((col) => (
                  <td key={`${idx}-${col}`} className="border p-2">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto mb-4 space-y-4 p-4 border rounded-md">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}>
            <div
              className={`max-w-3/4 rounded-lg px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.type === 'loading'
                  ? 'bg-gray-100 text-gray-800 flex items-center'
                  : message.type === 'error'
                  ? 'bg-red-100 text-red-800 flex items-center'
                  : 'bg-gray-200 text-gray-800'
              }`}>
              {message.type === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {message.content}
                </>
              ) : message.type === 'error' ? (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {message.content}
                </>
              ) : (
                <div className="w-full">
                  {message.type === 'user' ? (
                    <div className="whitespace-pre-line">{message.content}</div>
                  ) : (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  )}

                  {message.insightResult && (
                    <div className="mt-4">
                      <div className="mb-2">
                        {renderTableView(message.insightResult.tableData)}
                      </div>

                      <div className="flex justify-end mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleSaveInsight(message.insightResult!)
                          }
                          className="text-xs"
                          title="Save this insight">
                          <Save className="h-3 w-3 mr-1" />
                          Save Insight
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question about your data..."
          disabled={isLoading || apiKeyMissing}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={isLoading || !input.trim() || apiKeyMissing}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
