'use client';

import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PRESETS = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
] as const;

interface RangeSelectorProps {
  range: string;
  from?: string;
  to?: string;
  onRangeChange: (range: string) => void;
  onCustomRange: (from: string, to: string) => void;
}

export function RangeSelector({
  range,
  from,
  to,
  onRangeChange,
  onCustomRange,
}: RangeSelectorProps) {
  const [localFrom, setLocalFrom] = useState(from ?? '');
  const [localTo, setLocalTo] = useState(to ?? '');

  const isCustom = range === 'custom';

  const customLabel = isCustom && from && to ? `${from} → ${to}` : 'Custom';

  function handleApply() {
    if (localFrom && localTo) {
      onCustomRange(localFrom, localTo);
    }
  }

  return (
    <div className="flex items-center rounded-md border border-subtle">
      {PRESETS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onRangeChange(opt.value)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer first:rounded-l-md',
            range === opt.value ? 'bg-brand text-white' : 'text-fg-muted hover:bg-surface-2',
          )}
        >
          {opt.label}
        </button>
      ))}
      <Popover>
        <PopoverTrigger
          className={cn(
            'inline-flex cursor-pointer items-center gap-1.5 rounded-r-md px-3 py-1.5 text-xs font-medium transition-colors',
            isCustom ? 'bg-brand text-white' : 'text-fg-muted hover:bg-surface-2',
          )}
        >
          <CalendarIcon className="size-3" aria-hidden />
          {customLabel}
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-64 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">
            Custom date range
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-fg-muted">From</label>
              <input
                type="date"
                value={localFrom}
                onChange={(e) => setLocalFrom(e.target.value)}
                className="mt-1 h-8 w-full rounded-md border border-subtle bg-surface px-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div>
              <label className="text-xs text-fg-muted">To</label>
              <input
                type="date"
                value={localTo}
                min={localFrom}
                onChange={(e) => setLocalTo(e.target.value)}
                className="mt-1 h-8 w-full rounded-md border border-subtle bg-surface px-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              disabled={!localFrom || !localTo}
              onClick={handleApply}
            >
              Apply range
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
