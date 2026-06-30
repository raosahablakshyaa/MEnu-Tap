'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
        <div className="text-center">
          <p className="text-7xl font-extrabold text-red-500">500</p>
          <h1 className="mt-4 text-2xl font-bold text-zinc-900">Something went wrong</h1>
          <p className="mt-2 text-zinc-500">An unexpected error occurred. We&apos;ve been notified.</p>
          {error.digest && (
            <p className="mt-1 font-mono text-xs text-zinc-400">Error ID: {error.digest}</p>
          )}
          <div className="mt-8 flex items-center justify-center gap-4">
            <button onClick={reset} className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600">
              Try again
            </button>
            <Link href="/" className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
