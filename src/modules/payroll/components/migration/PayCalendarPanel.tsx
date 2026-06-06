'use client';

import { useState } from 'react';
import { CalendarClockIcon, Loader2Icon, PlusIcon, PencilIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';

import {
  usePayCalendars,
  useCreatePayCalendar,
  useUpdatePayCalendar,
  useLegalEntities,
  PAY_FREQUENCY_CONFIG,
  PAY_DATE_RULE_CONFIG,
} from '@/modules/payroll';
import type { PayCalendar, PayCalendarInput, PayFrequency, PayDateRule } from '@/modules/payroll';

const FREQUENCIES = Object.keys(PAY_FREQUENCY_CONFIG) as PayFrequency[];
const DATE_RULES = Object.keys(PAY_DATE_RULE_CONFIG) as PayDateRule[];

function CalendarDialog({
  open,
  onOpenChange,
  existing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  existing: PayCalendar | null;
}) {
  const { data: entities = [] } = useLegalEntities();
  const create = useCreatePayCalendar();
  const update = useUpdatePayCalendar();

  const [name, setName] = useState(existing?.name ?? '');
  const [legalEntityId, setLegalEntityId] = useState(existing?.legalEntityId ?? '');
  const [frequency, setFrequency] = useState<PayFrequency>(existing?.frequency ?? 'MONTHLY');
  const [periodAnchor, setPeriodAnchor] = useState(String(existing?.periodAnchor ?? 1));
  const [payDateRule, setPayDateRule] = useState<PayDateRule>(
    existing?.payDateRule ?? 'LAST_WORKING_DAY',
  );
  const [payDay, setPayDay] = useState(existing?.payDay ? String(existing.payDay) : '');
  const [cutoffDay, setCutoffDay] = useState(String(existing?.cutoffDay ?? 25));

  const needsPayDay = payDateRule !== 'LAST_WORKING_DAY';
  const pending = create.isPending || update.isPending;

  async function handleSubmit() {
    const body: PayCalendarInput = {
      name: name.trim(),
      legalEntityId: legalEntityId || null,
      frequency,
      periodAnchor: Math.min(28, Math.max(1, Number(periodAnchor) || 1)),
      payDateRule,
      payDay: needsPayDay ? Math.min(28, Math.max(1, Number(payDay) || 1)) : null,
      cutoffDay: Math.min(28, Math.max(1, Number(cutoffDay) || 25)),
      holidayCalendarId: existing?.holidayCalendarId ?? null,
    };
    try {
      if (existing) await update.mutateAsync({ id: existing.id, input: body });
      else await create.mutateAsync(body);
      toast.success(existing ? 'Pay calendar updated.' : 'Pay calendar created.');
      onOpenChange(false);
    } catch {
      toast.error('Failed to save pay calendar');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? 'Edit pay calendar' : 'New pay calendar'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="cal-name">Name</Label>
            <Input
              id="cal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="India Monthly"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Legal entity</Label>
            <Select
              value={legalEntityId || '_none'}
              onValueChange={(v) => setLegalEntityId(!v || v === '_none' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Unassigned</SelectItem>
                {entities.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as PayFrequency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {PAY_FREQUENCY_CONFIG[f].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cal-anchor">Period start day</Label>
            <Input
              id="cal-anchor"
              type="number"
              min={1}
              max={28}
              value={periodAnchor}
              onChange={(e) => setPeriodAnchor(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Pay date rule</Label>
            <Select value={payDateRule} onValueChange={(v) => setPayDateRule(v as PayDateRule)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RULES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {PAY_DATE_RULE_CONFIG[r].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cal-payday">Pay day</Label>
            <Input
              id="cal-payday"
              type="number"
              min={1}
              max={28}
              value={payDay}
              disabled={!needsPayDay}
              onChange={(e) => setPayDay(e.target.value)}
              placeholder={needsPayDay ? '1–28' : 'n/a'}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cal-cutoff">Input cutoff day</Label>
            <Input
              id="cal-cutoff"
              type="number"
              min={1}
              max={28}
              value={cutoffDay}
              onChange={(e) => setCutoffDay(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending || !name.trim()}>
            {pending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
            {existing ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PayCalendarPanel({ canManage }: { canManage: boolean }) {
  const { data: calendars = [], isLoading, isError, refetch } = usePayCalendars();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PayCalendar | null>(null);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(cal: PayCalendar) {
    setEditing(cal);
    setDialogOpen(true);
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">Pay calendars & cutoffs</h2>
          <p className="text-xs text-fg-muted">
            Published cycle schedule per entity — period start, input cutoff & pay date.
          </p>
        </div>
        {canManage && (
          <Button variant="outline" size="sm" onClick={openNew}>
            <PlusIcon className="size-3.5" aria-hidden />
            New calendar
          </Button>
        )}
      </div>

      <div className="rounded-lg border border-subtle bg-surface">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-4">
            <ErrorState message="Failed to load pay calendars" onRetry={() => refetch()} />
          </div>
        ) : calendars.length === 0 ? (
          <EmptyState
            title="No pay calendars"
            description="Create a calendar to define cutoffs and pay dates."
            illustration={<CalendarClockIcon className="size-8 text-fg-muted" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-subtle bg-surface-raised/40 text-left text-xs text-fg-muted">
                  <th className="px-4 py-2 font-medium">Calendar</th>
                  <th className="px-3 py-2 font-medium">Frequency</th>
                  <th className="px-3 py-2 font-medium">Period start</th>
                  <th className="px-3 py-2 font-medium">Cutoff</th>
                  <th className="px-3 py-2 font-medium">Pay date</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {calendars.map((c) => (
                  <tr key={c.id} className="border-b border-subtle last:border-0">
                    <td className="px-4 py-2.5 font-medium text-fg">{c.name}</td>
                    <td className="px-3 py-2.5 text-fg-muted">
                      {PAY_FREQUENCY_CONFIG[c.frequency].label}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-fg-muted">Day {c.periodAnchor}</td>
                    <td className="px-3 py-2.5 tabular-nums text-fg-muted">Day {c.cutoffDay}</td>
                    <td className="px-3 py-2.5 text-fg-muted">
                      {PAY_DATE_RULE_CONFIG[c.payDateRule].label}
                      {c.payDay ? ` (day ${c.payDay})` : ''}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7"
                          onClick={() => openEdit(c)}
                        >
                          <PencilIcon className="size-3.5" aria-hidden />
                          Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {dialogOpen && (
        <CalendarDialog
          key={editing?.id ?? 'new'}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          existing={editing}
        />
      )}
    </section>
  );
}
