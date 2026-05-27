'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CheckCircle2Icon, CheckIcon, InboxIcon, Loader2Icon, XCircleIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeamLeaveRequests, useBulkApproveLeave } from '@/modules/leave';
import type { LeaveRequest } from '@/modules/leave';

type Phase = 'selecting' | 'done';

interface ResultSummary {
  succeeded: number;
  failed: Array<{ id: string; message: string }>;
  approvedNames: string[];
}

function dateRange(start: string, end: string): string {
  try {
    const s = format(parseISO(start), 'MMM d');
    const e = format(parseISO(end), 'MMM d, yyyy');
    return start.slice(0, 10) === end.slice(0, 10) ? e : `${s} – ${e}`;
  } catch {
    return start;
  }
}

function RequestRow({
  req,
  checked,
  onToggle,
}: {
  req: LeaveRequest;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 hover:bg-surface-2 transition-colors">
      <Checkbox
        checked={checked}
        onCheckedChange={onToggle}
        aria-label={`Select leave request from ${req.employeeName ?? 'employee'}`}
        className="mt-0.5 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg truncate">
          {req.employeeName ?? '—'}
          {req.employeeCode && (
            <span className="ml-1.5 text-xs text-fg-muted font-normal">{req.employeeCode}</span>
          )}
        </p>
        <p className="text-xs text-fg-muted mt-0.5">
          {req.leaveTypeName} · {req.totalDays}d · {dateRange(req.startDate, req.endDate)}
        </p>
        {req.reason && (
          <p className="mt-0.5 text-xs text-fg-subtle italic line-clamp-1">
            &ldquo;{req.reason}&rdquo;
          </p>
        )}
      </div>
    </label>
  );
}

export function BulkApproveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('selecting');
  // null = "all selected" (default); a Set = explicit manual selection
  const [manualOverride, setManualOverride] = useState<Set<string> | null>(null);
  const [result, setResult] = useState<ResultSummary | null>(null);

  const { data, isLoading, isError, refetch } = useTeamLeaveRequests(
    { status: 'PENDING', limit: 50, page: 1 },
    open,
  );

  const bulkApprove = useBulkApproveLeave();

  const requests = useMemo(() => data?.requests ?? [], [data]);

  // When manualOverride is null all requests are selected; otherwise use the Set
  const selectedIds: Set<string> = manualOverride ?? new Set(requests.map((r) => r.id));
  const allSelected = requests.length > 0 && requests.every((r) => selectedIds.has(r.id));

  function handleOpenChange(o: boolean) {
    if (!o) {
      setPhase('selecting');
      setManualOverride(null);
      setResult(null);
      onClose();
    }
  }

  function toggleAll() {
    setManualOverride(allSelected ? new Set() : new Set(requests.map((r) => r.id)));
  }

  function toggleRow(id: string) {
    const current = manualOverride ?? new Set(requests.map((r) => r.id));
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setManualOverride(next);
  }

  function handleApprove() {
    const ids = Array.from(selectedIds);
    bulkApprove.mutate(
      { ids },
      {
        onSuccess: (res) => {
          const approvedNames = requests
            .filter((r) => res.succeeded.includes(r.id))
            .map((r) => r.employeeName ?? r.id);

          setResult({
            succeeded: res.succeeded.length,
            failed: res.failed.map((f) => ({ id: f.id, message: f.message })),
            approvedNames,
          });
          setPhase('done');

          if (res.failed.length === 0) {
            toast.success(
              `${res.succeeded.length} request${res.succeeded.length !== 1 ? 's' : ''} approved`,
            );
          }
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {phase === 'done' ? 'Approval Results' : 'Bulk Approve Leave Requests'}
          </DialogTitle>
          <DialogDescription>
            {phase === 'done'
              ? 'Summary of the bulk approval operation.'
              : 'All pending requests are pre-selected. Deselect any you want to skip.'}
          </DialogDescription>
        </DialogHeader>

        {/* ── Selecting phase ── */}
        {phase === 'selecting' && (
          <>
            <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
              {isLoading ? (
                <div className="space-y-3 py-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3">
                      <Skeleton className="size-4 rounded shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3.5 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="py-4">
                  <ErrorState
                    compact
                    message="Failed to load pending requests"
                    onRetry={() => refetch()}
                  />
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10">
                  <InboxIcon className="size-10 text-fg-muted" aria-hidden />
                  <p className="text-sm font-medium text-fg-muted">No pending leave requests</p>
                  <p className="text-xs text-fg-subtle">Your team is all caught up.</p>
                </div>
              ) : (
                <div className="py-1">
                  {/* Select-all row */}
                  <label className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 mb-1 border-b border-subtle hover:bg-surface-2 transition-colors">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all requests"
                      className="shrink-0"
                    />
                    <span className="text-xs font-medium text-fg-muted uppercase tracking-wide">
                      {allSelected ? 'Deselect all' : 'Select all'} ({requests.length})
                    </span>
                  </label>

                  {requests.map((req) => (
                    <RequestRow
                      key={req.id}
                      req={req}
                      checked={selectedIds.has(req.id)}
                      onToggle={() => toggleRow(req.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="mt-4 shrink-0">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={bulkApprove.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={selectedIds.size === 0 || isLoading || isError || bulkApprove.isPending}
              >
                {bulkApprove.isPending ? (
                  <>
                    <Loader2Icon className="mr-1.5 size-3.5 animate-spin" aria-hidden />
                    Approving…
                  </>
                ) : (
                  <>
                    <CheckIcon className="mr-1.5 size-3.5" aria-hidden />
                    Approve {selectedIds.size > 0 ? selectedIds.size : ''} selected
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Done / result phase ── */}
        {phase === 'done' && result && (
          <>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-4 py-2">
              {result.succeeded > 0 && (
                <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2Icon className="size-4 text-success shrink-0" aria-hidden />
                    <p className="text-sm font-medium text-success">
                      {result.succeeded} request{result.succeeded !== 1 ? 's' : ''} approved
                    </p>
                  </div>
                  {result.approvedNames.length > 0 && (
                    <ul className="ml-6 space-y-0.5">
                      {result.approvedNames.map((name, i) => (
                        <li key={i} className="text-xs text-fg-muted">
                          {name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {result.failed.length > 0 && (
                <div className="rounded-lg border border-danger/20 bg-danger/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircleIcon className="size-4 text-danger shrink-0" aria-hidden />
                    <p className="text-sm font-medium text-danger">
                      {result.failed.length} request{result.failed.length !== 1 ? 's' : ''} failed
                    </p>
                  </div>
                  <ul className="ml-6 space-y-1">
                    {result.failed.map((f, i) => (
                      <li key={i} className="text-xs text-fg-muted">
                        {f.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter className="mt-4 shrink-0">
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
