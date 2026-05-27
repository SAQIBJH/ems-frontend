'use client';

import { useState } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { EmptyState } from '@/components/feedback/EmptyState';
import { cn } from '@/lib/utils';
import { useAuditLogs } from '../hooks/useSettings';

const ENTITY_OPTIONS = [
  { value: '_all', label: 'All entities' },
  { value: 'Employee', label: 'Employee' },
  { value: 'Department', label: 'Department' },
  { value: 'LeaveRequest', label: 'Leave Request' },
  { value: 'AttendanceRecord', label: 'Attendance' },
  { value: 'Holiday', label: 'Holiday' },
  { value: 'User', label: 'User' },
];

const ACTION_OPTIONS = [
  { value: '_all', label: 'All actions' },
  { value: 'CREATE', label: 'Create' },
  { value: 'UPDATE', label: 'Update' },
  { value: 'DELETE', label: 'Delete' },
  { value: 'LOGIN', label: 'Login' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'APPROVE', label: 'Approve' },
  { value: 'DENY', label: 'Deny' },
];

const ACTION_STYLES: Record<string, string> = {
  CREATE: 'bg-success/10 text-success border-success/20',
  UPDATE: 'bg-info/10 text-info border-info/20',
  DELETE: 'bg-danger/10 text-danger border-danger/20',
  APPROVE: 'bg-success/10 text-success border-success/20',
  DENY: 'bg-danger/10 text-danger border-danger/20',
  LOGIN: 'bg-brand/10 text-brand border-brand/20',
  LOGOUT: 'bg-fg-disabled/10 text-fg-subtle border-subtle',
};

function ActionBadge({ action }: { action: string }) {
  const style = ACTION_STYLES[action] ?? 'bg-fg-disabled/10 text-fg-subtle border-subtle';
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[0.625rem] font-semibold border leading-none',
        style,
      )}
    >
      {action}
    </span>
  );
}

function AuditTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-1 py-2">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3.5 w-24 ml-auto" />
        </div>
      ))}
    </div>
  );
}

const PAGE_SIZE = 20;

export function AuditLogPanel() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('_all');
  const [action, setAction] = useState('_all');

  const params = {
    page,
    limit: PAGE_SIZE,
    ...(entity !== '_all' ? { entity } : {}),
    ...(action !== '_all' ? { action } : {}),
  };

  const { data, isLoading, isError, refetch } = useAuditLogs(params);

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;

  function handleEntityChange(val: string) {
    setEntity(val);
    setPage(1);
  }

  function handleActionChange(val: string) {
    setAction(val);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-fg">Audit Log</h2>
        <p className="text-sm text-fg-muted mt-0.5">
          A complete record of administrative actions across your organisation.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={entity} onValueChange={(val) => handleEntityChange(val ?? '_all')}>
          <SelectTrigger className="w-44">
            <SelectValue>
              {(v) => ENTITY_OPTIONS.find((o) => o.value === v)?.label ?? v}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ENTITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={action} onValueChange={(val) => handleActionChange(val ?? '_all')}>
          <SelectTrigger className="w-40">
            <SelectValue>
              {(v) => ACTION_OPTIONS.find((o) => o.value === v)?.label ?? v}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {ACTION_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isError ? (
        <ErrorState message="Failed to load audit logs." onRetry={() => void refetch()} />
      ) : isLoading ? (
        <AuditTableSkeleton />
      ) : logs.length === 0 ? (
        <EmptyState title="No audit logs" description="No activity matches the selected filters." />
      ) : (
        <div className="rounded-lg border border-subtle overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="text-right">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm text-fg">{log.user_email}</TableCell>
                  <TableCell>
                    <ActionBadge action={log.action} />
                  </TableCell>
                  <TableCell className="text-sm text-fg-muted">
                    {log.entity_type}
                    {log.entity_id && (
                      <span className="ml-1 font-mono text-[0.6875rem] text-fg-disabled">
                        {log.entity_id.slice(-8)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-xs text-fg-muted whitespace-nowrap">
                    {formatDistanceToNow(parseISO(log.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between text-sm text-fg-muted">
          <span>
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, pagination.total)} of{' '}
            {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
