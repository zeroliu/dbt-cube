import {Widget, CubeMetadata, ChartType} from '@/lib/cube-client';
import OpenAI from 'openai';

// Define the interface for AI-generated chart suggestions
export interface ChartSuggestion {
  widget: Widget;
  explanation: string;
}

// Define possible error types
export interface AIServiceError {
  message: string;
  code: string;
  details?: string;
}

// Interface for OpenAI response chart structure
interface OpenAIChartResponse {
  id: string;
  title: string;
  chartType: ChartType;
  cubeName: string;
  measures: string[];
  dimensions: string[];
  segments: string[];
  filters: Array<{
    member: string;
    operator: string;
    values: string[];
  }>;
  explanation: string;
}

// Interface for the full OpenAI response
interface OpenAIResponse {
  charts: OpenAIChartResponse[];
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Allow client-side usage
});

/**
 * Process a natural language query and convert it to potential chart suggestions
 * using the available cube metadata
 */
export async function generateChartSuggestions(
  query: string,
  metadata: CubeMetadata
): Promise<ChartSuggestion[]> {
  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw {
      message: 'OpenAI API key not configured',
      code: 'missing_api_key',
      details: 'Please add your OpenAI API key to the .env.local file',
    };
  }

  try {
    return await callOpenAI(query, metadata);
  } catch (error: unknown) {
    console.error('Failed to generate chart suggestions:', error);

    // Format error for the UI
    if (error instanceof Error) {
      // Handle standard errors (including parsing errors)
      throw {
        message: 'Failed to generate chart suggestions',
        code: 'ai_error',
        details:
          error.message || 'An error occurred while processing your request',
      };
    }

    // Handle OpenAI API errors
    const apiError = error as {status?: number; message?: string};

    if (apiError.status === 401) {
      throw {
        message: 'Invalid OpenAI API key',
        code: 'invalid_api_key',
        details: 'Please check your API key in the .env.local file',
      };
    } else if (apiError.status === 429) {
      throw {
        message: 'OpenAI rate limit exceeded',
        code: 'rate_limit',
        details: 'Please try again later or check your OpenAI account limits',
      };
    } else {
      throw {
        message: 'Failed to generate chart suggestions',
        code: 'ai_error',
        details:
          apiError.message ||
          'Unknown error occurred while processing your request',
      };
    }
  }
}

/**
 * Call OpenAI API to generate chart suggestions
 */
async function callOpenAI(
  query: string,
  metadata: CubeMetadata
): Promise<ChartSuggestion[]> {
  // Prepare metadata for the API call
  const cubesInfo = metadata.cubes.map((cube) => ({
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

  try {
    // Use the responses API with JSON schema validation
    const response = await openai.responses.create({
      model: 'gpt-4o',
      input: [
        {
          role: 'system',
          content: `You are an analytics assistant that converts natural language questions into chart configurations.

Available data cubes:
${JSON.stringify(cubesInfo, null, 2)}

Your task is to:
1. Analyze the user's question
2. Identify which cubes, measures, and dimensions would best answer their question
3. Suggest appropriate chart types (kpi, line, bar, or pie)
4. Return 1-3 chart configurations as an array of JSON objects

IMPORTANT REQUIREMENTS:
- Only use cubeName, measure names, and dimension names that actually exist in the provided metadata
- Use the exact name properties (not titles) for cubeName, measures, and dimensions
- For KPI charts, include only measures (no dimensions)
- For other charts, include at least one measure and one dimension
- Provide a short, clear explanation for each chart
- You MUST include all required fields in your response: id, title, chartType, cubeName, measures, dimensions, filters, and explanation
- For id fields, generate a unique string identifier
- Always include dimensions and filters as empty arrays if not used`,
        },
        {role: 'user', content: query},
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'chart_suggestions',
          schema: {
            type: 'object',
            properties: {
              charts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: {type: 'string'},
                    title: {type: 'string'},
                    chartType: {
                      type: 'string',
                      enum: ['kpi', 'line', 'bar', 'pie'],
                    },
                    cubeName: {type: 'string'},
                    measures: {
                      type: 'array',
                      items: {type: 'string'},
                    },
                    dimensions: {
                      type: 'array',
                      items: {type: 'string'},
                    },
                    segments: {
                      type: 'array',
                      items: {type: 'string'},
                    },
                    filters: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          member: {type: 'string'},
                          operator: {type: 'string'},
                          values: {
                            type: 'array',
                            items: {type: 'string'},
                          },
                        },
                        required: ['member', 'operator', 'values'],
                        additionalProperties: false,
                      },
                    },
                    explanation: {type: 'string'},
                  },
                  required: [
                    'id',
                    'title',
                    'chartType',
                    'cubeName',
                    'measures',
                    'dimensions',
                    'filters',
                    'explanation',
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ['charts'],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    // Parse the response
    const parsedResponse = JSON.parse(response.output_text) as OpenAIResponse;

    // Convert OpenAI response to ChartSuggestion format
    return parsedResponse.charts.map((chart: OpenAIChartResponse) => ({
      widget: {
        id: chart.id,
        title: chart.title,
        chartType: chart.chartType,
        cubeName: chart.cubeName,
        measures: chart.measures,
        dimensions: chart.dimensions,
        filters: chart.filters,
        segments: chart.segments,
      },
      explanation: chart.explanation,
    }));
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}
