'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckIcon, MinusIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { cn } from '@/lib/utils';

import {
  usePayrollComponents,
  useDeleteComponent,
  COMPONENT_TYPE_CONFIG,
  CALCULATION_TYPE_CONFIG,
  computeComponentBreakdown,
} from '../index';
import type { SalaryComponent } from '../types/payroll.types';
import { SalaryComponentDrawer } from './SalaryComponentDrawer';

const SAMPLE_CTC = 1_200_000;

type TypeFilter = 'all' | 'EARNING' | 'DEDUCTION' | 'BENEFIT' | 'REIMBURSEMENT';
type ActiveFilter = 'all' | 'active' | 'inactive';

export function SalaryComponentsPanel() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SalaryComponent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalaryComponent | null>(null);

  const { data: components = [], isLoading, isError, refetch } = usePayrollComponents();
  const deleteMutation = useDeleteComponent();

  const breakdown = useMemo(() => {
    if (!components.length) return new Map<string, number>();
    const calc = computeComponentBreakdown(components, SAMPLE_CTC);
    return new Map(calc.map((c) => [c.code, c.monthlyAmount]));
  }, [components]);

  const filtered = useMemo(
    () =>
      components.filter((c) => {
        if (
          search &&
          !c.name.toLowerCase().includes(search.toLowerCase()) &&
          !c.code.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        if (typeFilter !== 'all' && c.type !== typeFilter) return false;
        if (activeFilter === 'active' && !c.active) return false;
        if (activeFilter === 'inactive' && c.active) return false;
        return true;
      }),
    [components, search, typeFilter, activeFilter],
  );

  function openAdd() {
    setEditTarget(null);
    setDrawerOpen(true);
  }

  function openEdit(comp: SalaryComponent) {
    setEditTarget(comp);
    setDrawerOpen(true);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success(`${deleteTarget.name} deleted`);
        setDeleteTarget(null);
      },
      onError: (err) => {
        const apiErr = (
          err as AxiosError<{
            success: false;
            error: { code: string; message: string; details?: unknown };
          }>
        ).response?.data?.error;
        if (apiErr?.code === 'COMPONENT_IN_USE') {
          const detail = apiErr.details as
            | { affectedComponents?: string[]; affectedPayGroups?: string[] }
            | undefined;
          const comps = detail?.affectedComponents ?? [];
          const groups = detail?.affectedPayGroups ?? [];
          const deps = [...comps, ...groups].join(', ');
          toast.error(`Cannot delete: referenced by ${deps || 'other components'}`);
        } else {
          toast.error(apiErr?.message ?? 'Failed to delete component');
        }
        setDeleteTarget(null);
      },
    });
  }

  const columns: ColumnDef<SalaryComponent>[] = [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ getValue }) => (
        <span className="font-mono text-xs bg-surface-raised px-1.5 py-0.5 rounded text-fg-muted whitespace-nowrap">
          {getValue() as string}
        </span>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="min-w-[120px]">
          <p className="text-sm font-medium text-fg">{row.original.name}</p>
          {row.original.description && (
            <p className="text-xs text-fg-muted truncate max-w-[180px]">
              {row.original.description}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ getValue }) => {
        const type = getValue() as string;
        const cfg = COMPONENT_TYPE_CONFIG[type as keyof typeof COMPONENT_TYPE_CONFIG];
        return (
          <span
            className={cn(
              'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap',
              cfg.color,
            )}
          >
            {cfg.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'calculationType',
      header: 'Calculation',
      cell: ({ getValue, row }) => {
        const ct = getValue() as string;
        const cfg = CALCULATION_TYPE_CONFIG[ct as keyof typeof CALCULATION_TYPE_CONFIG];
        const comp = row.original;
        let detail = '';
        if (comp.calculationType === 'PERCENTAGE' && comp.basisCode) {
          detail = `of ${comp.basisCode}`;
        } else if (comp.calculationType === 'FLAT' && comp.value !== null) {
          detail = `₹${comp.value.toLocaleString('en-IN')}`;
        }
        return (
          <div className="min-w-[100px]">
            <p className="text-xs text-fg-muted">{cfg.label}</p>
            {detail && <p className="text-xs text-fg-muted">{detail}</p>}
          </div>
        );
      },
    },
    {
      id: 'valuePreview',
      header: 'Monthly (sample)',
      cell: ({ row }) => {
        const amount = breakdown.get(row.original.code);
        if (amount === undefined)
          return <span className="text-fg-muted tabular-nums text-sm">—</span>;
        return (
          <span className="tabular-nums text-sm text-fg whitespace-nowrap">
            ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        );
      },
    },
    {
      accessorKey: 'taxable',
      header: 'Taxable',
      cell: ({ getValue }) =>
        getValue() ? (
          <CheckIcon className="size-4 text-success" aria-label="Taxable" />
        ) : (
          <MinusIcon className="size-4 text-fg-muted" aria-label="Not taxable" />
        ),
    },
    {
      accessorKey: 'active',
      header: 'Active',
      cell: ({ getValue }) => {
        const active = getValue() as boolean;
        return (
          <span
            className={cn(
              'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
              active ? 'text-success bg-success/10' : 'text-fg-muted bg-surface-raised',
            )}
          >
            {active ? 'Active' : 'Inactive'}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(row.original);
            }}
            aria-label={`Edit ${row.original.name}`}
          >
            <PencilIcon className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row.original);
            }}
            aria-label={`Delete ${row.original.name}`}
            className="text-danger hover:text-danger hover:bg-danger/10"
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-48"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="all">All Types</option>
            <option value="EARNING">Earning</option>
            <option value="DEDUCTION">Deduction</option>
            <option value="BENEFIT">Benefit</option>
            <option value="REIMBURSEMENT">Reimbursement</option>
          </select>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <Button onClick={openAdd} size="default">
          <PlusIcon className="size-3.5" aria-hidden />
          Add Component
        </Button>
      </div>

      {/* Table */}
      <DynamicTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyTitle="No salary components"
        emptyDescription="Create your first salary component to start building pay groups."
        emptyAction={
          <Button onClick={openAdd} size="default">
            <PlusIcon className="size-3.5" aria-hidden />
            Add Component
          </Button>
        }
        rowLabel="components"
      />

      {/* Create / Edit Drawer */}
      <SalaryComponentDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        component={editTarget}
        allComponents={components}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title={`Delete "${deleteTarget?.name ?? 'component'}"?`}
        description="This component will be permanently deleted. If it is referenced by another component or pay group, deletion will be blocked."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
