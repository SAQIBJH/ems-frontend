'use client';

import { BarChart2Icon } from 'lucide-react';
import { ReportShell } from './ReportShell';

interface ReportPlaceholderProps {
  title: string;
  description?: string;
}

const PlaceholderContent = (
  <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
    <div className="flex size-12 items-center justify-center rounded-full bg-surface-2">
      <BarChart2Icon className="size-6 text-fg-muted" aria-hidden />
    </div>
    <div className="space-y-1">
      <p className="text-sm font-medium text-fg">Coming in the next step</p>
      <p className="text-xs text-fg-muted">This panel will be built in Steps 63–65.</p>
    </div>
  </div>
);

export function ReportPlaceholder({ title, description }: ReportPlaceholderProps) {
  return <ReportShell title={title} description={description} chart={PlaceholderContent} />;
}
