import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import CubeProviderWrapper from '@/components/cube-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Insights Platform',
  description: 'Analytics and dashboard platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <CubeProviderWrapper>
          <div className="flex flex-col min-h-screen">
            <header className="border-b">
              <div className="container mx-auto px-4 py-3">
                <nav className="flex items-center space-x-8">
                  <Link href="/" className="text-xl font-semibold">
                    Insights Platform
                  </Link>
                  <div className="flex space-x-6">
                    <div className="relative group">
                      <span className="flex items-center cursor-pointer font-medium">
                        Insights
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </span>
                      <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div
                          className="py-1"
                          role="menu"
                          aria-orientation="vertical">
                          <Link
                            href="/metrics"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem">
                            Metrics
                          </Link>
                          <Link
                            href="/dashboards"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem">
                            Dashboards
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="relative group">
                      <span className="flex items-center cursor-pointer font-medium">
                        AI Assistants
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </span>
                      <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <div
                          className="py-1"
                          role="menu"
                          aria-orientation="vertical">
                          <Link
                            href="/"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem">
                            Basic Chat
                          </Link>
                          <Link
                            href="/langgraph"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            role="menuitem">
                            Multi-Step Analysis
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </nav>
              </div>
            </header>
            <main className="flex-grow">{children}</main>
          </div>
        </CubeProviderWrapper>
      </body>
    </html>
  );
}
