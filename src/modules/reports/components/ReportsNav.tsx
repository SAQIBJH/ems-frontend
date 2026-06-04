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
    <nav className="py-2">
      {REPORT_NAV.map((group) => (
        <div key={group.heading} className="px-2 pb-2">
          <p className="px-3 pb-1.5 pt-2 text-[11px] font-medium uppercase tracking-[0.05em] text-fg-subtle">
            {group.heading}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.value}>
                <button
                  type="button"
                  onClick={() => onChange(item.value)}
                  className={cn(
                    'w-full rounded-lg px-3 py-[7px] text-left text-[13px] transition-[background,color] duration-[120ms] cursor-pointer',
                    active === item.value
                      ? 'bg-brand-50 font-medium text-brand'
                      : 'font-normal text-fg-muted hover:bg-surface-raised hover:text-fg',
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
