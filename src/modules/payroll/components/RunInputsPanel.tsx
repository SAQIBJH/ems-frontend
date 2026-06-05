'use client';

import { useState } from 'react';
import { Loader2Icon, UploadIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';

import { useRunInputs, useUpdateRunInput, useImportRunInputs } from '../hooks/usePayrollRuns';
import type { PayrollInput } from '../types/payroll.types';

/**
 * A self-contained numeric cell that commits on blur when the value changes.
 * The parent remounts it (via `key`) when the server value updates, so the
 * draft re-seeds without a synchronous setState-in-effect.
 */
function NumberCell({
  value,
  disabled,
  onCommit,
}: {
  value: number;
  disabled: boolean;
  onCommit: (next: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  return (
    <Input
      type="number"
      min={0}
      step="0.5"
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const next = Number(draft);
        if (!Number.isNaN(next) && next >= 0 && next !== value) onCommit(next);
        else setDraft(String(value));
      }}
      className="h-8 w-20 tabular-nums"
      aria-label="input value"
    />
  );
}

function ImportDialog({
  open,
  onOpenChange,
  runId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  runId: string;
}) {
  const [csv, setCsv] = useState('employeeCode,lopDays,otHours,leaveDays\n');
  const importInputs = useImportRunInputs();

  async function handleImport() {
    try {
      const result = await importInputs.mutateAsync({ runId, csv });
      toast.success(`Imported: ${result.updated} updated, ${result.skipped} skipped.`);
      if (result.errors.length > 0) toast.warning(result.errors.slice(0, 3).join(' · '));
      onOpenChange(false);
    } catch {
      toast.error('Failed to import inputs');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import period inputs</DialogTitle>
          <DialogDescription>
            Paste CSV with a header row. Recognised columns: employeeCode, lopDays, otHours,
            leaveDays.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-1">
          <Label htmlFor="csv-input">CSV</Label>
          <textarea
            id="csv-input"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            rows={6}
            className="w-full rounded-md border border-subtle bg-surface px-3 py-2 font-mono text-xs text-fg focus:outline-none focus:ring-2 focus:ring-brand/40"
            placeholder={'employeeCode,lopDays,otHours\nE0001,1,4'}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={importInputs.isPending}>
            {importInputs.isPending && (
              <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
            )}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RunInputsPanel({ runId }: { runId: string }) {
  const { data, isLoading, isError, refetch } = useRunInputs(runId);
  const update = useUpdateRunInput();
  const [importOpen, setImportOpen] = useState(false);

  const inputs = data?.inputs ?? [];
  const editable = data?.editable ?? false;

  function commit(input: PayrollInput, field: 'lopDays' | 'leaveDays' | 'otHours', next: number) {
    update.mutate(
      { runId, employeeId: input.employeeId, body: { [field]: next } },
      { onError: () => toast.error('Failed to save input') },
    );
  }

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="flex items-center justify-between border-b border-subtle px-4 py-3">
        <div>
          <h2 className="text-sm font-medium text-fg">Period Inputs</h2>
          <p className="text-xs text-fg-muted">
            {editable
              ? 'LOP from attendance, leave, and overtime hours feed the calculation.'
              : 'Inputs are locked once calculation has started.'}
          </p>
        </div>
        {editable && (
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <UploadIcon className="size-3.5" aria-hidden />
            Import CSV
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 rounded" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-4">
          <ErrorState message="Failed to load inputs" onRetry={() => refetch()} />
        </div>
      ) : inputs.length === 0 ? (
        <EmptyState
          title="No inputs"
          description="This run has no employees with payroll inputs yet."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-subtle bg-surface-raised/40 text-left text-xs text-fg-muted">
                <th className="px-4 py-2 font-medium">Employee</th>
                <th className="px-3 py-2 font-medium">LOP days</th>
                <th className="px-3 py-2 font-medium">Leave days</th>
                <th className="px-3 py-2 font-medium">OT hours</th>
              </tr>
            </thead>
            <tbody>
              {inputs.map((input) => (
                <tr key={input.employeeId} className="border-b border-subtle last:border-0">
                  <td className="px-4 py-2">
                    <div className="font-medium text-fg">{input.employeeName}</div>
                    <div className="font-mono text-xs text-fg-muted">{input.employeeCode}</div>
                  </td>
                  <td className="px-3 py-2">
                    <NumberCell
                      key={`lop-${input.lopDays}`}
                      value={input.lopDays}
                      disabled={!editable}
                      onCommit={(n) => commit(input, 'lopDays', n)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <NumberCell
                      key={`leave-${input.leaveDays}`}
                      value={input.leaveDays}
                      disabled={!editable}
                      onCommit={(n) => commit(input, 'leaveDays', n)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <NumberCell
                      key={`ot-${input.otHours}`}
                      value={input.otHours}
                      disabled={!editable}
                      onCommit={(n) => commit(input, 'otHours', n)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} runId={runId} />
    </div>
  );
}
