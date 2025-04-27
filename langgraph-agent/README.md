# LangGraph.js Agent

This is a LangGraph.js agent project that can be deployed to the LangGraph platform.

## Project Structure

```
langgraph-agent/
├── src/                    # Source code
│   ├── utils/              # Utilities
│   │   ├── state.ts        # State definition
│   │   ├── tools.ts        # Tools definition (empty)
│   │   └── nodes.ts        # Node functions
│   └── agent.ts            # Main graph definition
├── package.json            # Dependencies
├── .env                    # Environment variables (create this file)
└── langgraph.json          # LangGraph configuration
```

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with your API keys:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. Test your agent locally (requires LangGraph CLI):
   ```bash
   langgraph test
   ```

## Deployment

To deploy this agent to LangGraph platform:

1. Push your code to a GitHub repository
2. Follow the deployment instructions in the LangGraph platform documentation

## Learn More

- [LangGraph.js Documentation](https://langchain-ai.github.io/langgraphjs/)
- [LangGraph Platform](https://langchain-ai.github.io/langgraph/cloud/)
