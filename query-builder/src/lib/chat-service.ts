import {CubeMetadata} from '@/lib/cube-client';
import OpenAI from 'openai';

// Define CubeQueryPayload interface
export interface CubeQueryPayload {
  measures: string[];
  dimensions: string[];
  filters: Array<{
    member: string;
    operator: string;
    values: string[];
  }>;
  limit?: number;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Allow client-side usage
});

/**
 * Generate a CubeJS query from a natural language question
 */
export async function generateQuery(
  question: string,
  metadata: CubeMetadata
): Promise<CubeQueryPayload | null> {
  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
    return null;
  }

  // Prepare metadata for the API call - filter for visible cubes only
  const visibleCubes = metadata.cubes.filter((cube) => cube.isVisible);

  if (visibleCubes.length === 0) {
    console.error('No visible cubes found in metadata');
    return null;
  }

  try {
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

    // Call OpenAI to generate query
    const response = await openai.responses.create({
      model: 'gpt-4o',
      input: [
        {
          role: 'system',
          content: `You are an analytics assistant that converts natural language questions into CubeJS query configurations.

Available data cubes:
${JSON.stringify(cubesInfo, null, 2)}

Today's date is ${new Date().toISOString().split('T')[0]}.

Your task is to:
1. Analyze the user's question
2. Identify which cubes, measures, and dimensions would best answer their question
3. Return a CubeJS query configuration as a JSON object

IMPORTANT REQUIREMENTS:
- Only use measures and dimensions that actually exist in the provided metadata
- Use the exact name properties (not titles) for measures and dimensions
- Include dimensions if they help answer the question
- Add appropriate filters if the user's question mentions specific conditions
- Status are always UPPER_CASE
- Always include the time dimension because you are working with snapshots. Use today's date as the snapshot date if the user doesn't specify a date or ask for a trend. Granularity should be day. Enters date as YYYY-MM-DD. The end date is exclusive.
- Return a query that will retrieve meaningful data to answer the user's question`,
        },
        {role: 'user', content: question},
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'cube_query',
          schema: {
            type: 'object',
            properties: {
              measures: {
                type: 'array',
                items: {type: 'string'},
              },
              dimensions: {
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
              timeDimensions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    dimension: {type: 'string'},
                    granularity: {type: 'string'},
                    dateRange: {type: 'array', items: {type: 'string'}},
                  },
                  required: ['dimension', 'granularity', 'dateRange'],
                  additionalProperties: false,
                },
              },
              limit: {type: 'number'},
            },
            required: [
              'measures',
              'dimensions',
              'filters',
              'limit',
              'timeDimensions',
            ],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    // Parse and return the query
    return JSON.parse(response.output_text) as CubeQueryPayload;
  } catch (error) {
    console.error('Error generating CubeJS query:', error);
    return null;
  }
}

/**
 * Generate insights from query results
 */
export async function generateInsights(
  data: Record<string, string | number | boolean>[],
  question: string,
  queryPayload: CubeQueryPayload
): Promise<string> {
  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  if (data.length === 0) {
    throw new Error('No data available for analysis');
  }

  try {
    // Limit the data sample to avoid token limits
    const dataSample = data.slice(0, 20);
    const totalCount = data.length;

    // Call OpenAI to generate insights
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a data analytics expert that provides clear, insightful analysis of query results.
Your task is to:
1. Analyze the provided data sample and query
2. Generate concise, meaningful insights about the data
3. Focus on patterns, trends, anomalies, and key metrics
4. Make your insights specific to what the user asked

Format your response as clear, easy-to-read text with bullet points for key findings.
Avoid unnecessary introductions or conclusions.`,
        },
        {
          role: 'user',
          content: `User's question: "${question}"

Query configuration:
${JSON.stringify(queryPayload, null, 2)}

Data sample (${totalCount} total records, showing first ${dataSample.length}):
${JSON.stringify(dataSample, null, 2)}

Please provide insightful analysis of this data.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    });

    const insight = response.choices[0]?.message?.content;
    if (!insight) {
      throw new Error('Failed to generate insights from the data');
    }

    return insight;
  } catch (error) {
    console.error('Error generating insights:', error);
    throw new Error('Failed to analyze the data results');
  }
}
