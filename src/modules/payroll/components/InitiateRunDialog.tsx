'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { useInitiatePayrollRun, useCalculatePayrollRun, payrollRunsApi } from '@/modules/payroll';

/* ── constants ────────────────────────────────────────────────────────────── */

const MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear].map(String);

const selectClass =
  'w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 cursor-pointer';

/* ── component ────────────────────────────────────────────────────────────── */

interface InitiateRunDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InitiateRunDialog({ open, onOpenChange }: InitiateRunDialogProps) {
  const router = useRouter();

  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [includeAll, setIncludeAll] = useState(true);
  const [calculatingId, setCalculatingId] = useState<string | null>(null);

  const initiateMutation = useInitiatePayrollRun();
  const calculateMutation = useCalculatePayrollRun();

  // Poll the run until it leaves CALCULATING / DRAFT
  const { data: pollingRun } = useQuery({
    queryKey: ['payroll', 'runs', calculatingId, 'poll'],
    queryFn: () => payrollRunsApi.get(calculatingId!),
    enabled: open && !!calculatingId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'CALCULATING' || status === 'DRAFT' ? 3000 : false;
    },
  });

  // When status transitions out of transient states, navigate.
  // Guard on `open` so this only fires once: after navigation `open` becomes
  // false and re-running this effect is a no-op.
  useEffect(() => {
    if (
      open &&
      calculatingId &&
      pollingRun &&
      pollingRun.status !== 'CALCULATING' &&
      pollingRun.status !== 'DRAFT'
    ) {
      const id = calculatingId;
      toast.success('Payroll calculated — review before approving.');
      onOpenChange(false);
      router.push(`/payroll/${id}`);
    }
  }, [open, calculatingId, pollingRun, onOpenChange, router]);

  const isCalculating = open && !!calculatingId;
  const isPending = initiateMutation.isPending || calculateMutation.isPending || isCalculating;

  async function handleSubmit() {
    const period = `${year}-${month}`;
    try {
      const run = await initiateMutation.mutateAsync({
        period,
        includeAllActiveEmployees: includeAll,
      });
      await calculateMutation.mutateAsync(run.id);
      setCalculatingId(run.id);
    } catch (err) {
      const apiErr = (err as AxiosError<{ error: { message: string } }>).response?.data?.error;
      toast.error(apiErr?.message ?? 'Failed to initiate payroll run');
    }
  }

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Run Payroll</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Period */}
          <div className="space-y-1.5">
            <Label>Payroll Period</Label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={isPending}
                className={selectClass}
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={isPending}
                className={selectClass}
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-fg-muted">
              Selected: {MONTHS.find((m) => m.value === month)?.label} {year}
            </p>
          </div>

          {/* Include all active employees */}
          <div className="flex items-center gap-3">
            <input
              id="include-all"
              type="checkbox"
              checked={includeAll}
              onChange={(e) => setIncludeAll(e.target.checked)}
              disabled={isPending}
              className="size-4 accent-brand cursor-pointer"
            />
            <Label htmlFor="include-all" className="cursor-pointer font-normal">
              Include all active employees
            </Label>
          </div>

          {/* Calculating status */}
          {isCalculating && (
            <div className="flex items-center gap-2 rounded-md border border-info/30 bg-info/5 px-3 py-2.5 text-sm text-info">
              <Loader2Icon className="size-4 shrink-0 animate-spin" aria-hidden />
              <span>Calculating payroll… This may take a few seconds.</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => !isPending && onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending}>
            {(initiateMutation.isPending || calculateMutation.isPending) && (
              <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
            )}
            Calculate Payroll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
