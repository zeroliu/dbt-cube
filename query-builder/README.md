This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Query Builder

A dashboard and metric builder tool for visualizing data from Cube.js backend.

### Getting Started

First, set up your environment variables:

1. Copy the `.env.local.example` file to `.env.local` (or create it if it doesn't exist)
2. Add your OpenAI API key to `.env.local`:

```
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## AI-Powered Chart Generator

This application includes an AI-powered chart generator that uses the OpenAI API (GPT-4o model) to:

1. Process natural language questions about your data
2. Automatically create chart suggestions based on your requirements
3. Generate Cube.js payloads for previewing in the chart interface

To use this feature:

- Click on the "Ask AI" button in the dashboard
- Enter your question or requirements in natural language
- The AI will analyze your data structure and suggest appropriate charts
- Preview the generated charts and add them to your dashboard if desired

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Project Structure

- `/src/app` - Next.js app router pages
  - `/metrics` - Metrics management (list, create, edit, view)
  - `/dashboards` - Dashboard management (list, create, edit, view)
- `/src/components` - React components
  - `/dashboard` - Dashboard specific components
  - `/ui` - Reusable UI components
- `/src/lib` - Utility functions and API clients

### Known Issues and How to Fix

We have some type errors and missing component import errors that need fixing:

1. **Dynamic Route Params**: In Next.js App Router, params is now a Promise and should be unwrapped with React.use() before accessing properties. Currently fixed by directly using params.id which is still supported.

2. **Missing UI Components**: You might see errors about missing UI component modules. Fix by installing shadcn/ui components:

```bash
npm install @radix-ui/react-label class-variance-authority lucide-react
```

3. **Cube.js API Errors**: The code contains references to a Cube.js backend that doesn't exist. For demo purposes, we've implemented mock data generation. To use with a real Cube.js backend, update the connection settings in `src/lib/cube-client.ts`.

4. **Component Typing**: Multiple places need proper TypeScript types for events and data structures. We've fixed most of them but review any linting errors you still see.

### Features

- Create and manage reusable metrics
- Build dashboards from your metrics
- AI-powered metric creation
- Interactive query builder
- Visualization of metrics data

### Roadmap

- Improve error handling with API connections
- Add more visualization types
- Implement real-time dashboard updates
- Add user permissions system
- Enhance AI capabilities for data exploration
