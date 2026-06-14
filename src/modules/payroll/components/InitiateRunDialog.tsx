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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useInitiatePayrollRun,
  useCalculatePayrollRun,
  usePayrollRoster,
  usePayrollRuns,
  usePayCalendars,
  usePayCalendarCycles,
  payrollRunsApi,
  PAY_FREQUENCY_CONFIG,
} from '@/modules/payroll';
import type { PayrollRunType, PayrollRunInput } from '@/modules/payroll';

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

const RUN_TYPES: { value: PayrollRunType; label: string }[] = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'OFF_CYCLE', label: 'Off-cycle' },
  { value: 'BONUS', label: 'Bonus' },
  { value: 'ARREARS', label: 'Arrears' },
  { value: 'FNF', label: 'Full & final settlement' },
  { value: 'REVERSAL', label: 'Reversal' },
];

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
  const [runType, setRunType] = useState<PayrollRunType>('REGULAR');
  const [calculatingId, setCalculatingId] = useState<string | null>(null);

  // Pay calendar drives the period model: monthly → month+year; sub-monthly → cycle dropdown.
  const { data: calendars = [] } = usePayCalendars();
  const [calendarId, setCalendarId] = useState('');
  const [cyclePeriod, setCyclePeriod] = useState('');
  const selectedCalendar = calendars.find((c) => c.id === calendarId) ?? calendars[0];
  const isSubMonthly = !!selectedCalendar && selectedCalendar.frequency !== 'MONTHLY';
  const ym = `${year}-${month}`;
  const { data: cycles = [] } = usePayCalendarCycles(
    isSubMonthly ? (selectedCalendar?.id ?? null) : null,
    isSubMonthly ? { from: ym, to: ym } : null,
  );
  // Derived fallbacks (no effects): an unset/stale selection resolves to the first option.
  const selectedCycle = cycles.find((c) => c.period === cyclePeriod) ?? cycles[0];

  // FnF inputs
  const [fnfEmployee, setFnfEmployee] = useState('');
  const [lastWorkingDay, setLastWorkingDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [yearsOfService, setYearsOfService] = useState('5');
  const [leaveBalanceDays, setLeaveBalanceDays] = useState('12');
  const [noticeShortfallDays, setNoticeShortfallDays] = useState('0');

  // Off-cycle: the selected employee subset. Reversal: the run being offset.
  const [offCycleIds, setOffCycleIds] = useState<string[]>([]);
  const [reversalTargetId, setReversalTargetId] = useState('');

  const initiateMutation = useInitiatePayrollRun();
  const calculateMutation = useCalculatePayrollRun();
  const { data: roster = [] } = usePayrollRoster();
  const { data: runsPage } = usePayrollRuns({ limit: 50 });
  const isFnf = runType === 'FNF';
  const isOffCycle = runType === 'OFF_CYCLE';
  const isReversal = runType === 'REVERSAL';
  // Bonus & arrears are entered as amounts in Period Inputs after the run is created.
  const isExtraPay = runType === 'BONUS' || runType === 'ARREARS';

  // A reversal can only offset an approved or paid run.
  const reversibleRuns = (runsPage?.items ?? []).filter(
    (r) => r.status === 'APPROVED' || r.status === 'PAID',
  );

  function toggleOffCycle(id: string) {
    setOffCycleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

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
    // Sub-monthly: source period + schedule + dates from the chosen cycle. Monthly: YYYY-MM.
    const cycleFields: Partial<PayrollRunInput> =
      isSubMonthly && selectedCycle
        ? {
            period: selectedCycle.period,
            paySchedule: selectedCycle.paySchedule,
            periodLabel: selectedCycle.periodLabel,
            startDate: selectedCycle.startDate,
            endDate: selectedCycle.endDate,
            payDate: selectedCycle.payDate,
          }
        : { period: `${year}-${month}` };
    try {
      const run = await initiateMutation.mutateAsync({
        ...cycleFields,
        period: cycleFields.period!,
        includeAllActiveEmployees: includeAll,
        type: runType,
        fnf: isFnf
          ? {
              employeeId: fnfEmployee,
              lastWorkingDay,
              yearsOfService: Number(yearsOfService),
              leaveBalanceDays: Number(leaveBalanceDays),
              noticeShortfallDays: Number(noticeShortfallDays),
            }
          : undefined,
        employeeIds: isOffCycle ? offCycleIds : undefined,
        reversalOfRunId: isReversal ? reversalTargetId : undefined,
      });
      // Bonus/arrears need their amounts entered first — create as DRAFT and open the
      // run so HR can fill Period Inputs, then calculate from the run page.
      if (isExtraPay) {
        toast.success(
          `${runType === 'BONUS' ? 'Bonus' : 'Arrears'} run created — enter amounts in Period Inputs, then Calculate.`,
        );
        onOpenChange(false);
        router.push(`/payroll/${run.id}`);
        return;
      }
      await calculateMutation.mutateAsync(run.id);
      setCalculatingId(run.id);
    } catch (err) {
      const apiErr = (err as AxiosError<{ error: { message: string } }>).response?.data?.error;
      toast.error(apiErr?.message ?? 'Failed to initiate payroll run');
    }
  }

  const canSubmit =
    !isPending &&
    (!isFnf || !!fnfEmployee) &&
    (!isOffCycle || offCycleIds.length > 0) &&
    (!isReversal || !!reversalTargetId);

  return (
    <Dialog open={open} onOpenChange={isPending ? undefined : onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Run Payroll</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Run type */}
          <div className="space-y-1.5">
            <Label>Run Type</Label>
            <Select
              value={runType}
              onValueChange={(v) => v && setRunType(v as PayrollRunType)}
              disabled={isPending}
            >
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue>{(v) => RUN_TYPES.find((t) => t.value === v)?.label ?? v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {RUN_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pay calendar — its frequency decides month vs cycle selection */}
          {calendars.length > 0 && (
            <div className="space-y-1.5">
              <Label>Pay Calendar</Label>
              <Select
                value={selectedCalendar?.id}
                onValueChange={(v) => v && setCalendarId(v)}
                disabled={isPending}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue>
                    {(v) => calendars.find((c) => c.id === v)?.name ?? 'Select a pay calendar'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {calendars.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({PAY_FREQUENCY_CONFIG[c.frequency].label})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Period */}
          <div className="space-y-1.5">
            <Label>Payroll Period</Label>
            <div className="grid grid-cols-2 gap-3">
              <Select value={month} onValueChange={(v) => v && setMonth(v)} disabled={isPending}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue>{(v) => MONTHS.find((m) => m.value === v)?.label ?? v}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={(v) => v && setYear(v)} disabled={isPending}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sub-monthly: pick the specific pay cycle within the chosen month */}
            {isSubMonthly && (
              <div className="space-y-1.5 pt-1">
                <Label>Pay Cycle</Label>
                <Select
                  value={selectedCycle?.period}
                  onValueChange={(v) => v && setCyclePeriod(v)}
                  disabled={isPending || cycles.length === 0}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="Select a pay cycle">
                      {(v) =>
                        cycles.find((c) => c.period === v)?.periodLabel ?? 'Select a pay cycle'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.map((c) => (
                      <SelectItem key={c.period} value={c.period}>
                        {c.periodLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <p className="text-xs text-fg-muted">
              Selected:{' '}
              {isSubMonthly && selectedCycle
                ? selectedCycle.periodLabel
                : `${MONTHS.find((m) => m.value === month)?.label} ${year}`}
            </p>
          </div>

          {/* Include all active employees (regular roster runs only) */}
          {runType === 'REGULAR' && (
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
          )}

          {/* Bonus / arrears — amounts are entered after creation */}
          {isExtraPay && (
            <div className="rounded-md border border-info/30 bg-info/5 px-3 py-2.5 text-xs text-info">
              This run pays <span className="font-medium">only</span> the{' '}
              {runType === 'BONUS' ? 'bonus' : 'arrears'} amounts you enter. It will open as a draft
              — add per-employee amounts in <span className="font-medium">Period Inputs</span>, then
              click Calculate.
            </div>
          )}

          {/* Off-cycle — pick the employees to pay */}
          {isOffCycle && (
            <div className="space-y-1.5">
              <Label>Employees to pay ({offCycleIds.length} selected)</Label>
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-md border border-subtle p-2">
                {roster.length === 0 ? (
                  <p className="px-1 py-2 text-xs text-fg-muted">No employees on the roster.</p>
                ) : (
                  roster.map((m) => (
                    <label
                      key={m.employeeId}
                      className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 hover:bg-surface-raised"
                    >
                      <input
                        type="checkbox"
                        checked={offCycleIds.includes(m.employeeId)}
                        onChange={() => toggleOffCycle(m.employeeId)}
                        disabled={isPending}
                        className="size-4 accent-brand cursor-pointer"
                      />
                      <span className="text-sm text-fg">{m.employeeName}</span>
                      <span className="font-mono text-xs text-fg-muted">{m.employeeCode}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Reversal — pick the run to offset */}
          {isReversal && (
            <div className="space-y-1.5">
              <Label>Run to reverse</Label>
              <Select
                value={reversalTargetId}
                onValueChange={(v) => v && setReversalTargetId(v)}
                disabled={isPending}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Select an approved or paid run">
                    {(v) => {
                      const r = reversibleRuns.find((x) => x.id === v);
                      return r
                        ? `${r.periodLabel} · ${r.status}`
                        : 'Select an approved or paid run';
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {reversibleRuns.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.periodLabel} · {r.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-fg-muted">
                Creates an offsetting run with negative amounts. The original run is unchanged.
              </p>
            </div>
          )}

          {/* FnF settlement inputs */}
          {isFnf && (
            <div className="space-y-3 rounded-md border border-subtle bg-surface-raised/30 p-3">
              <div className="space-y-1.5">
                <Label>Employee</Label>
                <Select
                  value={fnfEmployee}
                  onValueChange={(v) => v && setFnfEmployee(v)}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="Select an employee">
                      {(v) =>
                        roster.find((m) => m.employeeId === v)?.employeeName ?? 'Select an employee'
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {roster.map((m) => (
                      <SelectItem key={m.employeeId} value={m.employeeId}>
                        {m.employeeName} · {m.employeeCode}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fnf-lwd">Last working day</Label>
                  <Input
                    id="fnf-lwd"
                    type="date"
                    value={lastWorkingDay}
                    onChange={(e) => setLastWorkingDay(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fnf-yos">Years of service</Label>
                  <Input
                    id="fnf-yos"
                    type="number"
                    min={0}
                    value={yearsOfService}
                    onChange={(e) => setYearsOfService(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fnf-leave">Leave balance (days)</Label>
                  <Input
                    id="fnf-leave"
                    type="number"
                    min={0}
                    value={leaveBalanceDays}
                    onChange={(e) => setLeaveBalanceDays(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fnf-notice">Notice shortfall (days)</Label>
                  <Input
                    id="fnf-notice"
                    type="number"
                    min={0}
                    value={noticeShortfallDays}
                    onChange={(e) => setNoticeShortfallDays(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>
          )}

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
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
            {(initiateMutation.isPending || calculateMutation.isPending) && (
              <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
            )}
            {isExtraPay ? 'Create Run' : isFnf ? 'Calculate Settlement' : 'Calculate Payroll'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
