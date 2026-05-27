'use client';

import { cn } from '@/lib/utils';
import { REPORT_NAV } from '../constants';
import type { ReportType } from '../types/reports.types';

interface ReportsNavProps {
  active: ReportType;
  onChange: (value: ReportType) => void;
}

export function ReportsNav({ active, onChange }: ReportsNavProps) {
  return (
    <nav className="w-56 shrink-0 space-y-4 py-1">
      {REPORT_NAV.map((group) => (
        <div key={group.heading}>
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-fg-muted">
            {group.heading}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.value}>
                <button
                  type="button"
                  onClick={() => onChange(item.value)}
                  className={cn(
                    'w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors cursor-pointer',
                    active === item.value
                      ? 'bg-surface-2 font-medium text-fg'
                      : 'text-fg-subtle hover:bg-surface-2/60 hover:text-fg',
                  )}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
