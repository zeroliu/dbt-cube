import type {AIMessage} from '@langchain/core/messages';
import {ChatOpenAI} from '@langchain/openai';
import {MessagesAnnotation} from '@langchain/langgraph';
import {tools} from './tools';

// Define the function that calls the model
export async function callModel(state: typeof MessagesAnnotation.State) {
  /**
   * Call the LLM powering our agent.
   */
  const model = new ChatOpenAI({
    model: 'gpt-4o',
  }).bindTools(tools);

  const response = await model.invoke([
    {
      role: 'system',
      content: `You are a helpful assistant. The current date is ${new Date().toISOString()}.`,
    },
    ...state.messages,
  ]);

  // MessagesAnnotation supports returning a single message or array of messages
  return {messages: response};
}

// Define the function that determines the next step
export function routeModelOutput(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const lastMessage: AIMessage = messages[messages.length - 1];
  // If the LLM is invoking tools, route there.
  if ((lastMessage?.tool_calls?.length ?? 0) > 0) {
    return 'tools';
  }
  // Otherwise end the graph.
  return '__end__';
}
