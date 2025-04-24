'use client';

import {ReactNode} from 'react';
import {CubeProvider} from '@cubejs-client/react';
import cubejs from '@cubejs-client/core';

// Initialize Cube.js API client
const API_URL =
  process.env.NEXT_PUBLIC_CUBE_API_URL || 'http://localhost:4000/cubejs-api/v1';
const CUBE_TOKEN = process.env.NEXT_PUBLIC_CUBE_TOKEN || 'development_token';

const cubejsApi = cubejs(CUBE_TOKEN, {
  apiUrl: API_URL,
});

interface CubeProviderWrapperProps {
  children: ReactNode;
}

export default function CubeProviderWrapper({
  children,
}: CubeProviderWrapperProps) {
  return <CubeProvider cubeApi={cubejsApi}>{children}</CubeProvider>;
}
