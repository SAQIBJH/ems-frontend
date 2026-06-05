'use client';

import { useState } from 'react';
import { Loader2Icon, PlusIcon, Trash2Icon } from 'lucide-react';
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
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';

import {
  useGarnishments,
  useCreateGarnishment,
  useDeleteGarnishment,
} from '../hooks/useGarnishments';
import { formatMoney, toMinor } from '../utils/money.utils';
import type { Garnishment, GarnishmentAmountKind, GarnishmentType } from '../types/payroll.types';

const TYPE_LABELS: Record<GarnishmentType, string> = {
  CHILD_SUPPORT: 'Child support',
  SPOUSAL_SUPPORT: 'Spousal support',
  TAX_LEVY: 'Tax levy',
  COURT_ORDER: 'Court attachment',
  DEFAULTED_LOAN: 'Loan recovery order',
};

const TYPE_OPTIONS = Object.keys(TYPE_LABELS) as GarnishmentType[];

function fmtDate(iso: string | null): string {
  if (!iso) return 'Present';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function amountText(g: Garnishment): string {
  return g.amount.kind === 'PERCENT_OF_DISPOSABLE'
    ? `${g.amount.value}% of disposable`
    : formatMoney(g.amount.value, 'INR');
}

function AddGarnishmentDialog({
  open,
  onOpenChange,
  employeeId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeId: string;
}) {
  const [type, setType] = useState<GarnishmentType>('CHILD_SUPPORT');
  const [kind, setKind] = useState<GarnishmentAmountKind>('PERCENT_OF_DISPOSABLE');
  const [value, setValue] = useState('20');
  const [priority, setPriority] = useState('1');
  const [floor, setFloor] = useState('25000');
  const [cap, setCap] = useState('');
  const [reference, setReference] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const create = useCreateGarnishment();

  async function handleSubmit() {
    const numValue = Number(value);
    try {
      await create.mutateAsync({
        employeeId,
        input: {
          type,
          priority: Number(priority) || 1,
          amount: {
            kind,
            // FLAT is money (→ minor units); PERCENT is a raw percentage.
            value: kind === 'FLAT' ? toMinor(numValue, 'INR') : numValue,
          },
          protectedEarningsFloor: toMinor(Number(floor) || 0, 'INR'),
          cap: cap.trim() ? toMinor(Number(cap), 'INR') : null,
          reference: reference.trim(),
          effectiveFrom,
        },
      });
      toast.success('Garnishment added.');
      onOpenChange(false);
    } catch {
      toast.error('Failed to add garnishment');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add garnishment / court order</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as GarnishmentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="garn-priority">Priority</Label>
            <Input
              id="garn-priority"
              type="number"
              min={1}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Amount type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as GarnishmentAmountKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PERCENT_OF_DISPOSABLE">% of disposable</SelectItem>
                <SelectItem value="FLAT">Flat amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="garn-value">{kind === 'FLAT' ? 'Amount (₹)' : 'Percent (%)'}</Label>
            <Input
              id="garn-value"
              type="number"
              min={0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="garn-floor">Protected take-home (₹)</Label>
            <Input
              id="garn-floor"
              type="number"
              min={0}
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="garn-cap">Cap (₹, optional)</Label>
            <Input
              id="garn-cap"
              type="number"
              min={0}
              value={cap}
              onChange={(e) => setCap(e.target.value)}
              placeholder="No cap"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="garn-ref">Reference</Label>
            <Input
              id="garn-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="COURT/2026/1234"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="garn-from">Effective from</Label>
            <Input
              id="garn-from"
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={create.isPending || !reference.trim() || Number(value) <= 0}
          >
            {create.isPending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function GarnishmentsCard({
  employeeId,
  mode,
}: {
  employeeId: string;
  mode: 'employee' | 'hr';
}) {
  const { data: garnishments = [], isLoading, isError, refetch } = useGarnishments(employeeId);
  const remove = useDeleteGarnishment();
  const [addOpen, setAddOpen] = useState(false);

  async function handleDelete(garnishmentId: string) {
    try {
      await remove.mutateAsync({ employeeId, garnishmentId });
      toast.success('Garnishment removed.');
    } catch {
      toast.error('Failed to remove garnishment');
    }
  }

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-fg">Garnishments &amp; Court Orders</h3>
          <p className="text-xs text-fg-muted">
            Applied after statutory deductions, before voluntary ones, by priority.
          </p>
        </div>
        {mode === 'hr' && (
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <PlusIcon className="size-3.5" aria-hidden />
            Add
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-4">
          <ErrorState message="Failed to load garnishments" onRetry={() => refetch()} />
        </div>
      ) : garnishments.length === 0 ? (
        <EmptyState
          title="No garnishments"
          description="This employee has no court-ordered deductions on file."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle bg-surface-raised/40 text-left text-xs text-fg-muted">
                <th className="px-4 py-2 font-medium">Order</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Protected</th>
                <th className="px-3 py-2 font-medium">Effective</th>
                {mode === 'hr' && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody>
              {garnishments.map((g) => (
                <tr key={g.id} className="border-b border-subtle last:border-0">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-fg">{TYPE_LABELS[g.type]}</div>
                    <div className="font-mono text-xs text-fg-muted">{g.reference}</div>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-fg-muted">{g.priority}</td>
                  <td className="px-3 py-2.5 tabular-nums text-fg">
                    {amountText(g)}
                    {g.cap != null && (
                      <span className="block text-xs text-fg-muted">
                        cap {formatMoney(g.cap, 'INR')}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-fg-muted">
                    {formatMoney(g.protectedEarningsFloor, 'INR')}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-fg-muted">
                    {fmtDate(g.effectiveFrom)} – {fmtDate(g.effectiveTo)}
                  </td>
                  {mode === 'hr' && (
                    <td className="px-3 py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-danger hover:text-danger"
                        onClick={() => handleDelete(g.id)}
                        disabled={remove.isPending}
                        aria-label="Remove garnishment"
                      >
                        <Trash2Icon className="size-3.5" aria-hidden />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddGarnishmentDialog open={addOpen} onOpenChange={setAddOpen} employeeId={employeeId} />
    </div>
  );
}
