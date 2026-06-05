'use client';

import { useState } from 'react';
import { Loader2Icon, PlusIcon } from 'lucide-react';
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
import { cn } from '@/lib/utils';

import { useClaims, useClaimCategories, useSubmitClaim, useDecideClaim } from '../hooks/useClaims';
import { formatMoney, fromMinor, toMinor } from '../utils/money.utils';
import type { ClaimStatus, ReimbursementClaim } from '../types/payroll.types';

const STATUS_STYLES: Record<ClaimStatus, string> = {
  SUBMITTED: 'bg-warning/10 text-warning',
  APPROVED: 'bg-info/10 text-info',
  REJECTED: 'bg-danger/10 text-danger',
  PAID: 'bg-success/10 text-success',
};

function NewClaimDialog({
  open,
  onOpenChange,
  employeeId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeId: string;
}) {
  const { data: categories = [] } = useClaimCategories();
  const submit = useSubmitClaim();
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const selected = categories.find((c) => c.code === category);

  async function handleSubmit() {
    try {
      await submit.mutateAsync({
        employeeId,
        input: { category, amount: toMinor(Number(amount), 'INR'), description },
      });
      toast.success('Claim submitted.');
      onOpenChange(false);
      setAmount('');
      setDescription('');
    } catch {
      toast.error('Could not submit claim — check the category cap.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New reimbursement claim</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label} · cap {formatMoney(c.monthlyCap, 'INR')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected && (
              <p className="text-xs text-fg-muted">
                Maximum {formatMoney(selected.monthlyCap, 'INR')} per period.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="claim-amount">Amount (₹)</Label>
            <Input
              id="claim-amount"
              type="number"
              min={0}
              max={selected ? fromMinor(selected.monthlyCap, 'INR') : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="claim-desc">Description</Label>
            <Input
              id="claim-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this claim for?"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submit.isPending || !category || !amount || Number(amount) <= 0}
          >
            {submit.isPending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClaimRow({ claim, mode }: { claim: ReimbursementClaim; mode: 'employee' | 'hr' }) {
  const decide = useDecideClaim();

  async function handleDecide(status: 'APPROVED' | 'REJECTED') {
    try {
      await decide.mutateAsync({ id: claim.id, status });
      toast.success(`Claim ${status.toLowerCase()}.`);
    } catch {
      toast.error('Failed to update claim');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-subtle px-4 py-3 last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium text-fg">{claim.category}</div>
        {claim.description && <div className="text-xs text-fg-muted">{claim.description}</div>}
      </div>
      <div className="ml-auto flex items-center gap-4">
        <span className="text-sm font-semibold tabular-nums text-fg">
          {formatMoney(claim.amount, claim.currency)}
        </span>
        <span
          className={cn(
            'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
            STATUS_STYLES[claim.status],
          )}
        >
          {claim.status.charAt(0) + claim.status.slice(1).toLowerCase()}
        </span>
        {mode === 'hr' && claim.status === 'SUBMITTED' && (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDecide('REJECTED')}
              disabled={decide.isPending}
            >
              Reject
            </Button>
            <Button size="sm" onClick={() => handleDecide('APPROVED')} disabled={decide.isPending}>
              Approve
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ClaimsCard({ employeeId, mode }: { employeeId: string; mode: 'employee' | 'hr' }) {
  const { data: claims = [], isLoading, isError, refetch } = useClaims({ employeeId });
  const [newOpen, setNewOpen] = useState(false);

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-fg">Reimbursement Claims</h3>
          <p className="text-xs text-fg-muted">
            Approved claims are paid with the next payroll run.
          </p>
        </div>
        {mode === 'employee' && (
          <Button variant="outline" size="sm" onClick={() => setNewOpen(true)}>
            <PlusIcon className="size-3.5" aria-hidden />
            New claim
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
          <ErrorState message="Failed to load claims" onRetry={() => refetch()} />
        </div>
      ) : claims.length === 0 ? (
        <EmptyState
          title="No claims"
          description={
            mode === 'employee'
              ? 'Submit a reimbursement claim for fuel, internet, and more.'
              : 'This employee has no reimbursement claims.'
          }
        />
      ) : (
        <div>
          {claims.map((claim) => (
            <ClaimRow key={claim.id} claim={claim} mode={mode} />
          ))}
        </div>
      )}

      <NewClaimDialog open={newOpen} onOpenChange={setNewOpen} employeeId={employeeId} />
    </div>
  );
}
