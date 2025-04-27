'use server';

import {ChatPromptTemplate} from '@langchain/core/prompts';
import {ChatOpenAI} from '@langchain/openai';
import {z} from 'zod';
import {fetchCubeMetadata, cubejsApi} from '@/lib/cube-client';
import type {Query} from '@cubejs-client/core';
import {StructuredOutputParser} from 'langchain/output_parsers';

// Define result type for the data returned by the agent
export interface QueryResult {
  type: string;
  data: Record<string, unknown>[];
  query: Record<string, unknown>;
  question?: string;
}

// Define a type for cube metadata objects to avoid using 'any'
interface CubeInfo {
  name: string;
  title: string;
  description?: string;
  isVisible: boolean;
  measures: {
    name: string;
    title: string;
    shortTitle: string;
  }[];
  dimensions: {
    name: string;
    title: string;
    shortTitle: string;
  }[];
}

// Define schema for our state - using a private version
const _StateSchema = z.object({
  question: z.string(),
  plan: z.array(z.string()).optional(),
  currentStep: z.number().optional(),
  metadata: z.record(z.any()),
  queries: z.array(z.record(z.any())).optional(),
  results: z.array(z.record(z.any())).optional(),
  insights: z.string().optional(),
  error: z.string().optional(),
  done: z.boolean().optional(),
  additionalSteps: z.array(z.string()).optional(),
});

// Export the schema as an async function for "use server" compatibility
export async function StateSchema() {
  return _StateSchema;
}

export type GraphState = z.infer<typeof _StateSchema>;

/**
 * Gets the total number without a measure, using count aggregation
 */
// async function getTotalCount(state: GraphState): Promise<GraphState> {
//   try {
//     const metadata = state.metadata;
//     const visibleCubes = metadata.cubes.filter((cube: any) => cube.isVisible);

//     if (visibleCubes.length === 0) {
//       return {
//         ...state,
//         error: 'No visible cubes found in metadata',
//       };
//     }

//     // Choose a primary visible cube (this can be refined with LLM to pick the most appropriate cube)
//     const primaryCube = visibleCubes[0].name;

//     // Create a simple count query
//     const countQuery = {
//       measures: [`${primaryCube}.count`],
//       dimensions: [],
//       filters: [],
//       timeDimensions: [
//         {
//           dimension: `${primaryCube}.createdAt`,
//           granularity: 'day',
//           dateRange: ['2023-01-01', '2024-12-31'], // This can be adjusted based on the data
//         },
//       ],
//     };

//     // Execute the query
//     const resultSet = await cubejsApi.load(countQuery as unknown as Query);
//     const data = resultSet.tablePivot();

//     // Add to results
//     const newResults = state.results || [];
//     newResults.push({
//       type: 'total',
//       data,
//       query: countQuery,
//     });

//     const newQueries = state.queries || [];
//     newQueries.push(countQuery);

//     return {
//       ...state,
//       queries: newQueries,
//       results: newResults,
//     };
//   } catch (error) {
//     console.error('Error in getTotalCount:', error);
//     return {
//       ...state,
//       error: `Failed to get total count: ${error}`,
//     };
//   }
// }

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

    const metadata = state.metadata;
    const visibleCubes = metadata.cubes.filter(
      (cube: CubeInfo) => cube.isVisible
    );

    if (visibleCubes.length === 0) {
      return {
        ...state,
        error: 'No visible cubes found in metadata',
      };
    }

    // Prepare metadata for the API call
    const cubesInfo = visibleCubes.map((cube: CubeInfo) => ({
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

    // Define the JSON schema for the Cube query
    const cubeQuerySchema = z.object({
      measures: z.array(z.string()),
      dimensions: z.array(z.string()).optional(),
      filters: z
        .array(
          z.object({
            member: z.string(),
            operator: z.string(),
            values: z.array(z.string().or(z.number())),
          })
        )
        .optional(),
      timeDimensions: z
        .array(
          z.object({
            dimension: z.string(),
            granularity: z.string().optional(),
            dateRange: z.array(z.string()).optional(),
          })
        )
        .optional(),
      limit: z.number().optional(),
    });

    // Create a structured output parser
    const structuredOutputParser =
      StructuredOutputParser.fromZodSchema(cubeQuerySchema);

    // Escape literal braces in format instructions
    const formatInstructions = structuredOutputParser
      .getFormatInstructions()
      .replace(/{/g, '{{')
      .replace(/}/g, '}}');
    // Escape literal braces in JSON string
    const cubesInfoString = JSON.stringify(cubesInfo, null, 2)
      .replace(/{/g, '{{')
      .replace(/}/g, '}}');

    const queryGenerationPrompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are an analytics assistant that converts natural language questions into CubeJS query configurations.

Available data cubes:
${cubesInfoString}

Today's date is ${new Date().toISOString().split('T')[0]}.

Your task is to:
1. Analyze the user's question
2. Identify which cubes, measures, and dimensions would best answer their question
3. Return a CubeJS query configuration

IMPORTANT REQUIREMENTS:
- Only use measures and dimensions that actually exist in the provided metadata
- Use the exact name properties (not titles) for measures and dimensions
- Include dimensions if they help answer the question
- Add appropriate filters if the user's question mentions specific conditions
- Status values are always UPPER_CASE
- Always include the time dimension because you are working with snapshots. Use today's date as the snapshot date if the user doesn't specify a date or ask for a trend. Granularity should be day. Enters date as YYYY-MM-DD. The end date is exclusive.

${formatInstructions}`,
      ],
      [
        'user',
        `Generate a CubeJS query to answer this question: "${state.question}"`,
      ],
    ]);

    const queryGenerationChain = queryGenerationPrompt
      .pipe(model)
      .pipe(structuredOutputParser);
    const parsedQuery = await queryGenerationChain.invoke({});

    // Execute the query
    const resultSet = await cubejsApi.load(parsedQuery as Query);
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
      temperature: 0,
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

    // Escape literal braces in JSON strings
    const totalDataString = JSON.stringify(totalData, null, 2)
      .replace(/{/g, '{{')
      .replace(/}/g, '}}');
    const detailedDataString = JSON.stringify(detailedData, null, 2)
      .replace(/{/g, '{{')
      .replace(/}/g, '}}');
    const queryUsedString = JSON.stringify(detailedResult.query, null, 2)
      .replace(/{/g, '{{')
      .replace(/}/g, '}}');

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
${totalDataString}

DETAILED DATA:
${detailedDataString}

QUERY USED:
${queryUsedString}

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

    // Define the schema for anomaly analysis
    const anomalySchema = z.object({
      needsAdditionalAnalysis: z.boolean(),
      explanation: z.string(),
      additionalQueries: z.array(z.string()).optional(),
    });

    // Create a structured output parser
    const structuredOutputParser =
      StructuredOutputParser.fromZodSchema(anomalySchema);

    // Escape literal braces in format instructions
    const formatInstructions = structuredOutputParser
      .getFormatInstructions()
      .replace(/{/g, '{{')
      .replace(/}/g, '}}');

    const anomalyPrompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a data analytics expert that evaluates insights for potential anomalies or patterns that require further investigation.

Your task is to:
1. Review the insights provided
2. Determine if there are any unusual patterns, anomalies, or questions that require additional data analysis
3. If additional analysis is needed, specify exactly what additional queries would help explain the anomalies
4. Return a clear decision on whether additional analysis is needed
5. If additional analysis is needed, provide a precise description of what additional data should be queried

${formatInstructions}`,
      ],
      [
        'user',
        `User's question: "${state.question}"

Insights generated:
${state.insights}

Based on these insights, determine if additional analysis is needed to explain unusual patterns or anomalies.`,
      ],
    ]);

    const anomalyChain = anomalyPrompt.pipe(model).pipe(structuredOutputParser);
    const parsedResponse = await anomalyChain.invoke({});

    if (
      parsedResponse.needsAdditionalAnalysis &&
      parsedResponse.additionalQueries &&
      parsedResponse.additionalQueries.length > 0
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

    const metadata = state.metadata;
    const visibleCubes = metadata.cubes.filter(
      (cube: CubeInfo) => cube.isVisible
    );

    if (visibleCubes.length === 0) {
      return {
        ...state,
        error: 'No visible cubes found in metadata',
      };
    }

    // Process each additional query
    const newResults = [...(state.results || [])];
    const newQueries = [...(state.queries || [])];

    // Define the JSON schema for the Cube query
    const cubeQuerySchema = z.object({
      measures: z.array(z.string()),
      dimensions: z.array(z.string()).optional(),
      filters: z
        .array(
          z.object({
            member: z.string(),
            operator: z.string(),
            values: z.array(z.string().or(z.number())),
          })
        )
        .optional(),
      timeDimensions: z
        .array(
          z.object({
            dimension: z.string(),
            granularity: z.string().optional(),
            dateRange: z.array(z.string()).optional(),
          })
        )
        .optional(),
      limit: z.number().optional(),
    });

    for (const additionalQuery of state.additionalSteps) {
      // Prepare metadata for the API call
      const cubesInfo = visibleCubes.map((cube: CubeInfo) => ({
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

      // Create a structured output parser
      const structuredOutputParser =
        StructuredOutputParser.fromZodSchema(cubeQuerySchema);

      // Escape literal braces in format instructions
      const formatInstructions = structuredOutputParser
        .getFormatInstructions()
        .replace(/{/g, '{{')
        .replace(/}/g, '}}');
      // Escape literal braces in JSON string
      const cubesInfoString = JSON.stringify(cubesInfo, null, 2)
        .replace(/{/g, '{{')
        .replace(/}/g, '}}');

      const queryGenerationPrompt = ChatPromptTemplate.fromMessages([
        [
          'system',
          `You are an analytics assistant that converts natural language questions into CubeJS query configurations.

Available data cubes:
${cubesInfoString}

Today's date is ${new Date().toISOString().split('T')[0]}.

Your task is to:
1. Analyze the user's request for additional analysis
2. Identify which cubes, measures, and dimensions would best address the specific question
3. Return a CubeJS query configuration

${formatInstructions}`,
        ],
        [
          'user',
          `Generate a CubeJS query to address this follow-up question: "${additionalQuery}"`,
        ],
      ]);

      const queryGenerationChain = queryGenerationPrompt
        .pipe(model)
        .pipe(structuredOutputParser);

      try {
        const parsedQuery = await queryGenerationChain.invoke({});

        // Execute the query
        const resultSet = await cubejsApi.load(parsedQuery as Query);
        const data = resultSet.tablePivot();

        // Add to results
        newResults.push({
          type: 'additional',
          data,
          query: parsedQuery,
          question: additionalQuery,
        });

        newQueries.push(parsedQuery);
      } catch (error) {
        console.error(
          `Error processing additional query: ${additionalQuery}`,
          error
        );
        continue;
      }
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
  try {
    const model = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY || 'your_openai_api_key_here',
    });

    // Define schema for plan steps
    const planSchema = z.object({
      steps: z.array(z.string()),
    });

    // Create a structured output parser
    const structuredOutputParser =
      StructuredOutputParser.fromZodSchema(planSchema);

    // Escape literal braces in format instructions
    const formatInstructions = structuredOutputParser
      .getFormatInstructions()
      .replace(/{/g, '{{')
      .replace(/}/g, '}}');

    const planningPrompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        `You are a data analytics planning assistant that creates a step-by-step plan to answer a user's question.

Your task is to:
1. Analyze the user's question
2. Break down the analytical process into logical steps
3. Return a list of steps needed to fully answer the question

Your plan should typically include these kinds of steps:
1. Get detailed data to examine specific aspects
2. Generate insights from the data
3. Determine if additional analysis is needed for anomalies
4. Execute additional analysis if needed

${formatInstructions}`,
      ],
      [
        'user',
        `Create a plan to address this analytics question: "${state.question}"`,
      ],
    ]);

    const planningChain = planningPrompt
      .pipe(model)
      .pipe(structuredOutputParser);
    const planResult = await planningChain.invoke({});

    return {
      ...state,
      plan: planResult.steps,
      currentStep: 0,
    };
  } catch (error) {
    console.error('Error in createPlan:', error);
    return {
      ...state,
      error: `Failed to create plan: ${error}`,
    };
  }
}

/**
 * Process a user query through the analytics agent
 * This is a server action that handles the LangGraph processing
 */
export async function processAnalyticsQuery(question: string) {
  try {
    // Fetch metadata and ensure it's serializable
    const fetchedMetadata = await fetchCubeMetadata();

    // Create a plain metadata object
    const metadata = JSON.parse(JSON.stringify(fetchedMetadata));

    let state: GraphState = {
      question,
      metadata,
    };

    // Execute the steps in sequence
    state = await createPlan(state);
    // state = await getTotalCount(state);
    state = await getDetailedData(state);
    state = await generateInsights(state);
    state = await evaluateAnomalies(state);

    // Check if we need additional analysis
    if (state.additionalSteps && state.additionalSteps.length > 0) {
      state = await executeAdditionalAnalysis(state);
    }

    // Ensure the final state is serializable
    return JSON.parse(JSON.stringify(state));
  } catch (error) {
    console.error('Error in processAnalyticsQuery:', error);
    return {
      question,
      error: `Failed to process query: ${error}`,
    };
  }
}
