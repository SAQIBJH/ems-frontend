import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'sticky top-0 z-10 bg-canvas/95 backdrop-blur-sm border-b border-subtle px-6 py-4',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 mb-1" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && (
                    <ChevronRight className="h-3 w-3 text-fg-disabled shrink-0" aria-hidden />
                  )}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-xs font-medium text-fg-muted hover:text-fg transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-xs font-medium text-fg-muted">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          <h1 className="text-xl font-semibold text-fg leading-tight truncate">{title}</h1>
          {description && <p className="text-sm text-fg-muted mt-0.5 leading-5">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
