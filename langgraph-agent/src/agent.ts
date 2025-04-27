import {StateGraph} from '@langchain/langgraph';
import {ToolNode} from '@langchain/langgraph/prebuilt';
import {MessagesAnnotation} from './utils/state';
import {tools} from './utils/tools';
import {callModel, routeModelOutput} from './utils/nodes';

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
  // Define the nodes we will cycle between
  .addNode('callModel', callModel)
  .addNode('tools', new ToolNode(tools))
  // Set the entrypoint as `callModel`
  .addEdge('__start__', 'callModel')
  .addConditionalEdges(
    // Source node
    'callModel',
    // Function to determine the next node
    routeModelOutput,
    // List of possible destinations
    ['tools', '__end__']
  )
  // After tools are called, return to callModel
  .addEdge('tools', 'callModel');

// Compile the graph for deployment
export const graph = workflow.compile();
