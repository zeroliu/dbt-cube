'use client';

import {useState, useEffect, useRef} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Loader2, Send, AlertTriangle} from 'lucide-react';
import {v4 as uuidv4} from 'uuid';
import ReactMarkdown from 'react-markdown';
import {processAnalyticsQuery} from '@/lib/actions';
import type {GraphState, QueryResult} from '@/lib/actions';

type MessageType =
  | 'user'
  | 'system'
  | 'loading'
  | 'error'
  | 'plan'
  | 'step'
  | 'insights';

interface MessageDetails {
  steps?: string[];
  data?: Record<string, unknown>[];
  type?: 'table' | 'chart';
}

interface Message {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  details?: MessageDetails;
}

export default function LangGraphAgent() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      type: 'system',
      content:
        "I'm ready to help you analyze your data. This agent will follow a multi-step process, making autonomous decisions based on the data it finds. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  };

  const addMessage = (
    type: MessageType,
    content: string,
    details?: MessageDetails
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        id: uuidv4(),
        type,
        content,
        timestamp: new Date(),
        details,
      },
    ]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) return;

    const question = input.trim();
    addMessage('user', question);
    setInput('');
    setIsLoading(true);
    addMessage('loading', 'Planning analytical approach...');

    try {
      // Execute the server action with the user's question
      const result = await processAnalyticsQuery(question);

      // Remove loading message
      setMessages((prev) => prev.filter((msg) => msg.type !== 'loading'));

      // Add the plan to the chat if it exists
      if (result.plan && result.plan.length > 0) {
        addMessage('plan', 'Planning analytical approach with these steps:', {
          steps: result.plan,
        });
      }

      // Display results if they exist
      if (result.results && result.results.length > 0) {
        // Only show visualization for detailed results to avoid clutter
        const detailedResults = result.results.find(
          (r: QueryResult) => r.type === 'detailed'
        );
        if (detailedResults) {
          addMessage('step', 'Retrieved and analyzed data', {
            data: detailedResults.data?.slice(0, 10) as Record<
              string,
              unknown
            >[],
            type: 'table',
          });
        }
      }

      // Add insights if they exist
      if (result.insights) {
        addMessage('insights', result.insights);
      }

      // If there was an error, show it
      if (result.error) {
        addMessage('error', `Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error in agent execution:', error);
      setMessages((prev) => prev.filter((msg) => msg.type !== 'loading'));
      addMessage(
        'error',
        'Sorry, I encountered an error processing your query. Please try again with a different question.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Render the message based on its type
  const renderMessage = (message: Message) => {
    switch (message.type) {
      case 'user':
        return (
          <div className="bg-blue-50 p-3 rounded-lg">{message.content}</div>
        );
      case 'system':
        return (
          <div className="p-3 rounded-lg">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        );
      case 'insights':
        return (
          <div className="bg-green-50 p-3 rounded-lg">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        );
      case 'loading':
        return (
          <div className="flex items-center space-x-2 p-3">
            <Loader2 className="animate-spin h-4 w-4" />
            <span>{message.content}</span>
          </div>
        );
      case 'error':
        return (
          <div className="bg-red-50 flex items-center space-x-2 p-3 rounded-lg">
            <AlertTriangle className="text-red-500 h-4 w-4" />
            <span>{message.content}</span>
          </div>
        );
      case 'plan':
        return (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="font-semibold">{message.content}</p>
            {message.details?.steps && (
              <ol className="list-decimal pl-5 mt-2">
                {message.details.steps.map((step: string, index: number) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            )}
          </div>
        );
      case 'step':
        return (
          <div className="p-3 rounded-lg">
            <p className="font-medium">{message.content}</p>
            {message.details?.data && message.details.type === 'table' && (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      {Object.keys(message.details.data[0] || {}).map((key) => (
                        <th
                          key={key}
                          className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {message.details.data.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {Object.entries(row).map(([key, value]) => (
                          <td
                            key={`${rowIndex}-${key}`}
                            className="px-4 py-2 whitespace-nowrap">
                            {typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      default:
        return <div className="p-3 rounded-lg">{message.content}</div>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}>
            <div
              className={`max-w-[80%] ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200'
              } rounded-lg shadow`}>
              {renderMessage(message)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask about your data..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
