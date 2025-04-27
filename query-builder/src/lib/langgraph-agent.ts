import {ChatPromptTemplate} from '@langchain/core/prompts';
import {StateGraph, StateGraphArgs, END} from '@langchain/langgraph';
import {RunnableLambda} from '@langchain/core/runnables';
import {ChatOpenAI} from '@langchain/openai';
import {z} from 'zod';
import {CubeMetadata} from '@/lib/cube-client';
import {cubejsApi} from '@/lib/cube-client';
import type {Query} from '@cubejs-client/core';
import type {GraphState} from '@/lib/actions';

// Define schema for our state
const StateSchema = z.object({
  question: z.string(),
  plan: z.array(z.string()).optional(),
  currentStep: z.number().optional(),
  metadata: z.any(),
  queries: z.array(z.any()).optional(),
  results: z.array(z.any()).optional(),
  insights: z.string().optional(),
  error: z.string().optional(),
  done: z.boolean().optional(),
  additionalSteps: z.array(z.string()).optional(),
});

/**
 * Gets the total number without a measure, using count aggregation
 */
async function getTotalCount(state: GraphState): Promise<GraphState> {
  try {
    const metadata = state.metadata as CubeMetadata;
    const visibleCubes = metadata.cubes.filter((cube) => cube.isVisible);

    if (visibleCubes.length === 0) {
      return {
        ...state,
        error: 'No visible cubes found in metadata',
      };
    }

    // Choose a primary visible cube (this can be refined with LLM to pick the most appropriate cube)
    const primaryCube = visibleCubes[0].name;

    // Create a simple count query
    const countQuery = {
      measures: [`${primaryCube}.count`],
      dimensions: [],
      filters: [],
      timeDimensions: [
        {
          dimension: `${primaryCube}.createdAt`,
          granularity: 'day',
          dateRange: ['2023-01-01', '2024-12-31'], // This can be adjusted based on the data
        },
      ],
    };

    // Execute the query
    const resultSet = await cubejsApi.load(countQuery as unknown as Query);
    const data = resultSet.tablePivot();

    // Add to results
    const newResults = state.results || [];
    newResults.push({
      type: 'total',
      data,
      query: countQuery,
    });

    const newQueries = state.queries || [];
    newQueries.push(countQuery);

    return {
      ...state,
      queries: newQueries,
      results: newResults,
    };
  } catch (error) {
    console.error('Error in getTotalCount:', error);
    return {
      ...state,
      error: `Failed to get total count: ${error}`,
    };
  }
}

/**
 * Gets detailed data based on the user question
 */
async function getDetailedData(state: GraphState): Promise<GraphState> {
  try {
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY || 'your_openai_api_key_here',
    });

    const metadata = state.metadata as CubeMetadata;
    const visibleCubes = metadata.cubes.filter((cube) => cube.isVisible);

    if (visibleCubes.length === 0) {
      return {
        ...state,
        error: 'No visible cubes found in metadata',
      };
    }

    // Prepare metadata for the API call
    const cubesInfo = visibleCubes.map((cube) => ({
      name: cube.name,
      title: cube.title,
      description: cube.description || '',
      measures: cube.measures.map((m) => ({
        name: m.name,
        title: m.title,
        shortTitle: m.shortTitle,
      })),
      dimensions: cube.dimensions.map((d) => ({
        name: d.name,
        title: d.title,
        shortTitle: d.shortTitle,
      })),
    }));

    const queryGenerationPrompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are an analytics assistant that converts natural language questions into CubeJS query configurations.

Available data cubes:
${JSON.stringify(cubesInfo, null, 2)}

Today's date is ${new Date().toISOString().split('T')[0]}.

Your task is to:
1. Analyze the user's question
2. Identify which cubes, measures, and dimensions would best answer their question
3. Return a CubeJS query configuration as a JSON object with the following structure:
{
  "measures": ["cube.measure1", "cube.measure2"],
  "dimensions": ["cube.dimension1", "cube.dimension2"],
  "filters": [
    {
      "member": "cube.dimension3",
      "operator": "equals",
      "values": ["value1"]
    }
  ],
  "timeDimensions": [
    {
      "dimension": "cube.timestamp",
      "granularity": "day",
      "dateRange": ["2023-01-01", "2024-01-01"]
    }
  ],
  "limit": 100
}

IMPORTANT REQUIREMENTS:
- Only use measures and dimensions that actually exist in the provided metadata
- Use the exact name properties (not titles) for measures and dimensions
- Include dimensions if they help answer the question
- Add appropriate filters if the user's question mentions specific conditions
- Status values are always UPPER_CASE
- Always include time dimensions because we're working with snapshots`,
      ],
      [
        'user',
        `Generate a CubeJS query to answer this question: "${state.question}"`,
      ],
    ]);

    const queryGenerationChain = queryGenerationPrompt.pipe(model);
    const queryGenerationResult = await queryGenerationChain.invoke({});

    // Parse the JSON from the response
    const responseText = queryGenerationResult.content.toString();
    const jsonMatch =
      responseText.match(/```json\n([\s\S]*?)\n```/) ||
      responseText.match(/```\n([\s\S]*?)\n```/) ||
      responseText.match(/{[\s\S]*?}/);

    if (!jsonMatch) {
      return {
        ...state,
        error: 'Failed to parse query JSON from model response',
      };
    }

    let parsedQuery;
    try {
      parsedQuery = JSON.parse(
        jsonMatch[0].startsWith('{') ? jsonMatch[0] : jsonMatch[1]
      );
    } catch (e) {
      console.error('JSON parse error:', e);
      return {
        ...state,
        error: `Failed to parse query JSON: ${e}`,
      };
    }

    // Execute the query
    const resultSet = await cubejsApi.load(parsedQuery as unknown as Query);
    const data = resultSet.tablePivot();

    // Add to results
    const newResults = state.results || [];
    newResults.push({
      type: 'detailed',
      data,
      query: parsedQuery,
    });

    const newQueries = state.queries || [];
    newQueries.push(parsedQuery);

    return {
      ...state,
      queries: newQueries,
      results: newResults,
    };
  } catch (error) {
    console.error('Error in getDetailedData:', error);
    return {
      ...state,
      error: `Failed to get detailed data: ${error}`,
    };
  }
}

/**
 * Generates insights from the collected data
 */
async function generateInsights(state: GraphState): Promise<GraphState> {
  try {
    if (!state.results || state.results.length === 0) {
      return {
        ...state,
        error: 'No data available for generating insights',
      };
    }

    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.2,
      openAIApiKey: process.env.OPENAI_API_KEY || 'your_openai_api_key_here',
    });

    // Prepare results data
    const totalResult = state.results.find((result) => result.type === 'total');
    const detailedResult = state.results.find(
      (result) => result.type === 'detailed'
    );

    if (!totalResult || !detailedResult) {
      return {
        ...state,
        error: 'Missing required data for insights',
      };
    }

    // Limit data samples to avoid token limits
    const totalData = totalResult.data.slice(0, 5);
    const detailedData = detailedResult.data.slice(0, 20);

    const insightsPrompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a data analytics expert that provides clear, insightful analysis of query results.

Your task is to:
1. Analyze both the overview counts and the detailed data provided
2. Identify patterns, trends, anomalies, and key insights
3. Generate a concise, meaningful analysis that directly answers the user's question
4. Explain what the data shows and any important implications
5. Identify if there are any unusual patterns that require additional investigation

Format your response as clear, easy-to-read text with bullet points for key findings.
Keep your analysis concise and focused on the most important insights.`,
      ],
      [
        'user',
        `User's question: "${state.question}"

OVERVIEW DATA:
${JSON.stringify(totalData, null, 2)}

DETAILED DATA:
${JSON.stringify(detailedData, null, 2)}

QUERY USED:
${JSON.stringify(detailedResult.query, null, 2)}

Please provide an insightful analysis answering the question based on this data.`,
      ],
    ]);

    const insightsChain = insightsPrompt.pipe(model);
    const insightsResult = await insightsChain.invoke({});

    return {
      ...state,
      insights: insightsResult.content.toString(),
    };
  } catch (error) {
    console.error('Error in generateInsights:', error);
    return {
      ...state,
      error: `Failed to generate insights: ${error}`,
    };
  }
}

/**
 * Evaluates if anomalies require additional investigation
 */
async function evaluateAnomalies(state: GraphState): Promise<GraphState> {
  try {
    if (!state.insights) {
      return {
        ...state,
        additionalSteps: [],
      };
    }

    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY || 'your_openai_api_key_here',
    });

    const anomalyPrompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a data analytics expert that evaluates insights for potential anomalies or patterns that require further investigation.

Your task is to:
1. Review the insights provided
2. Determine if there are any unusual patterns, anomalies, or questions that require additional data analysis
3. If additional analysis is needed, specify exactly what additional queries would help explain the anomalies
4. Return a clear YES or NO decision on whether additional analysis is needed
5. If YES, provide a precise description of what additional data should be queried

Format your response as a JSON object with the following structure:
{
  "needsAdditionalAnalysis": true/false,
  "explanation": "Explanation of why additional analysis is needed or not",
  "additionalQueries": [
    "Description of additional query 1",
    "Description of additional query 2"
  ]
}`,
      ],
      [
        'user',
        `User's question: "${state.question}"

Insights generated:
${state.insights}

Based on these insights, determine if additional analysis is needed to explain unusual patterns or anomalies.`,
      ],
    ]);

    const anomalyChain = anomalyPrompt.pipe(model);
    const anomalyResult = await anomalyChain.invoke({});

    // Parse the JSON from the response
    const responseText = anomalyResult.content.toString();
    const jsonMatch =
      responseText.match(/```json\n([\s\S]*?)\n```/) ||
      responseText.match(/```\n([\s\S]*?)\n```/) ||
      responseText.match(/{[\s\S]*?}/);

    if (!jsonMatch) {
      return {
        ...state,
        additionalSteps: [],
      };
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(
        jsonMatch[0].startsWith('{') ? jsonMatch[0] : jsonMatch[1]
      );
    } catch (e) {
      console.error('JSON parse error:', e);
      return {
        ...state,
        additionalSteps: [],
      };
    }

    if (
      parsedResponse.needsAdditionalAnalysis &&
      parsedResponse.additionalQueries?.length > 0
    ) {
      return {
        ...state,
        additionalSteps: parsedResponse.additionalQueries,
      };
    } else {
      return {
        ...state,
        additionalSteps: [],
      };
    }
  } catch (error) {
    console.error('Error in evaluateAnomalies:', error);
    return {
      ...state,
      additionalSteps: [],
    };
  }
}

/**
 * Executes additional analysis based on identified anomalies
 */
async function executeAdditionalAnalysis(
  state: GraphState
): Promise<GraphState> {
  try {
    if (!state.additionalSteps || state.additionalSteps.length === 0) {
      return state;
    }

    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY || 'your_openai_api_key_here',
    });

    const metadata = state.metadata as CubeMetadata;
    const visibleCubes = metadata.cubes.filter((cube) => cube.isVisible);

    if (visibleCubes.length === 0) {
      return {
        ...state,
        error: 'No visible cubes found in metadata',
      };
    }

    // Process each additional query
    const newResults = [...(state.results || [])];
    const newQueries = [...(state.queries || [])];

    for (const additionalQuery of state.additionalSteps) {
      // Prepare metadata for the API call
      const cubesInfo = visibleCubes.map((cube) => ({
        name: cube.name,
        title: cube.title,
        description: cube.description || '',
        measures: cube.measures.map((m) => ({
          name: m.name,
          title: m.title,
          shortTitle: m.shortTitle,
        })),
        dimensions: cube.dimensions.map((d) => ({
          name: d.name,
          title: d.title,
          shortTitle: d.shortTitle,
        })),
      }));

      const queryGenerationPrompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `You are an analytics assistant that converts natural language questions into CubeJS query configurations.

Available data cubes:
${JSON.stringify(cubesInfo, null, 2)}

Today's date is ${new Date().toISOString().split('T')[0]}.

Your task is to:
1. Analyze the user's request for additional analysis
2. Identify which cubes, measures, and dimensions would best address the specific question
3. Return a CubeJS query configuration as a JSON object`,
        ],
        [
          'user',
          `Generate a CubeJS query to address this follow-up question: "${additionalQuery}"`,
        ],
      ]);

      const queryGenerationChain = queryGenerationPrompt.pipe(model);
      const queryGenerationResult = await queryGenerationChain.invoke({});

      // Parse the JSON from the response
      const responseText = queryGenerationResult.content.toString();
      const jsonMatch =
        responseText.match(/```json\n([\s\S]*?)\n```/) ||
        responseText.match(/```\n([\s\S]*?)\n```/) ||
        responseText.match(/{[\s\S]*?}/);

      if (!jsonMatch) {
        continue;
      }

      let parsedQuery;
      try {
        parsedQuery = JSON.parse(
          jsonMatch[0].startsWith('{') ? jsonMatch[0] : jsonMatch[1]
        );
      } catch (e) {
        console.error('JSON parse error:', e);
        continue;
      }

      // Execute the query
      const resultSet = await cubejsApi.load(parsedQuery as unknown as Query);
      const data = resultSet.tablePivot();

      // Add to results
      newResults.push({
        type: 'additional',
        data,
        query: parsedQuery,
        question: additionalQuery,
      });

      newQueries.push(parsedQuery);
    }

    // Generate final consolidated insights
    const finalInsightsPrompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a data analytics expert that provides clear, insightful analysis of query results.

Your task is to:
1. Review the original insights and the additional data analysis performed
2. Create a comprehensive, cohesive analysis that incorporates all findings
3. Highlight any new patterns or explanations revealed by the additional analysis
4. Provide a complete answer to the user's original question

Format your response as clear, easy-to-read text with bullet points for key findings.`,
      ],
      [
        'user',
        `User's original question: "${state.question}"

ORIGINAL INSIGHTS:
${state.insights}

ADDITIONAL ANALYSIS RESULTS:
${JSON.stringify(
  newResults
    .filter((r) => r.type === 'additional')
    .map((r) => ({
      question: r.question,
      data: r.data.slice(0, 10),
    })),
  null,
  2
)}

Please provide a comprehensive analysis that incorporates all findings.`,
      ],
    ]);

    const finalInsightsChain = finalInsightsPrompt.pipe(model);
    const finalInsightsResult = await finalInsightsChain.invoke({});

    return {
      ...state,
      results: newResults,
      queries: newQueries,
      insights: finalInsightsResult.content.toString(),
      done: true,
    };
  } catch (error) {
    console.error('Error in executeAdditionalAnalysis:', error);
    return {
      ...state,
      error: `Failed to execute additional analysis: ${error}`,
      done: true,
    };
  }
}

/**
 * Creates a plan for addressing the user's question
 */
async function createPlan(state: GraphState): Promise<GraphState> {
  const model = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY || 'your_openai_api_key_here',
  });

  const planningPrompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      `You are a data analytics planning assistant that creates a step-by-step plan to answer a user's question.

Your task is to:
1. Analyze the user's question
2. Break down the analytical process into logical steps
3. Return a list of steps needed to fully answer the question

Your plan should typically include these kinds of steps:
1. Get a total count/overview to understand the scale
2. Get detailed data to examine specific aspects
3. Generate insights from the combined data
4. Determine if additional analysis is needed for anomalies
5. Execute additional analysis if needed

Format your response as a simple list of steps.`,
    ],
    [
      'user',
      `Create a plan to address this analytics question: "${state.question}"`,
    ],
  ]);

  const planningChain = planningPrompt.pipe(model);
  const planningResult = await planningChain.invoke({});

  // Extract the plan as an array of steps
  const planText = planningResult.content.toString();
  const planSteps = planText
    .split('\n')
    .filter((line) => line.trim().match(/^\d+\.\s/))
    .map((line) => line.replace(/^\d+\.\s+/, '').trim());

  return {
    ...state,
    plan: planSteps,
    currentStep: 0,
  };
}

/**
 * Creates a LangGraph agent with Plan-and-Execute architecture
 */
export function createAnalyticsAgent(metadata: CubeMetadata) {
  // We'll use a simpler approach for the StateGraph
  const builder = new StateGraph({
    channels: StateSchema,
  } as StateGraphArgs);

  // Define nodes
  builder.addNode('createPlan', new RunnableLambda({func: createPlan}));
  builder.addNode('getTotalCount', new RunnableLambda({func: getTotalCount}));
  builder.addNode(
    'getDetailedData',
    new RunnableLambda({func: getDetailedData})
  );
  builder.addNode(
    'generateInsights',
    new RunnableLambda({func: generateInsights})
  );
  builder.addNode(
    'evaluateAnomalies',
    new RunnableLambda({func: evaluateAnomalies})
  );
  builder.addNode(
    'executeAdditionalAnalysis',
    new RunnableLambda({func: executeAdditionalAnalysis})
  );

  // Define edges
  builder.addEdge('createPlan', 'getTotalCount');
  builder.addEdge('getTotalCount', 'getDetailedData');
  builder.addEdge('getDetailedData', 'generateInsights');
  builder.addEdge('generateInsights', 'evaluateAnomalies');

  // Conditional edge based on whether we need additional analysis
  builder.addConditionalEdges('evaluateAnomalies', (state) => {
    if (state.additionalSteps && state.additionalSteps.length > 0) {
      return 'executeAdditionalAnalysis';
    } else {
      return END;
    }
  });

  builder.addEdge('executeAdditionalAnalysis', END);

  // Set the entry point
  builder.setEntryPoint('createPlan');

  // Compile the graph
  const graph = builder.compile();

  // Return a function that takes a question and returns the graph execution
  return async function (question: string) {
    const result = await graph.invoke({
      question,
      metadata,
    });

    return result;
  };
}

// Export types for use in other components
export type {GraphState};
