import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas p-8 text-center">
      <div className="space-y-1">
        <p className="text-6xl font-bold text-fg-disabled" aria-hidden>
          404
        </p>
        <h1 className="text-xl font-semibold text-fg">Page not found</h1>
        <p className="max-w-sm text-sm text-fg-muted">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex h-9 items-center justify-center rounded-md bg-brand px-4 text-sm font-medium text-on-primary transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Go to dashboard
      </Link>
    </div>
  );
}
