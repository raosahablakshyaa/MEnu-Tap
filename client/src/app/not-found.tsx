import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: '404 — Page Not Found' };

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 dark:bg-zinc-950">
      <div className="text-center">
        <p className="text-7xl font-extrabold text-orange-500">404</p>
        <h1 className="mt-4 text-2xl font-bold text-zinc-900 dark:text-white">Page not found</h1>
        <p className="mt-2 text-zinc-500">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/" className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600">
            Go home
          </Link>
          <Link href="/owner" className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
