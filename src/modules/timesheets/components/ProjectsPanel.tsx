'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  FolderKanbanIcon,
  PencilIcon,
  PlusIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DynamicTable } from '@/shared/engines/DynamicTable';
import { cn } from '@/lib/utils';

import { useProjects, useDeleteProject, useUpdateProject } from '../hooks/useProjects';
import { PROJECT_STATUS_CONFIG, BILLABLE_CONFIG } from '../constants';
import { ProjectDrawer } from './ProjectDrawer';
import type { Project } from '../types/timesheet.types';

export function ProjectsPanel({ canManage }: { canManage: boolean }) {
  const { data: projects = [], isLoading, isError, refetch } = useProjects();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  function openNew() {
    setEditing(null);
    setDrawerOpen(true);
  }
  function openEdit(project: Project) {
    setEditing(project);
    setDrawerOpen(true);
  }
  function handleArchive(project: Project) {
    deleteProject.mutate(project.id, {
      onSuccess: () => toast.success(`Project ${project.code} archived`),
      onError: () => toast.error('Failed to archive project'),
    });
  }
  function handleUnarchive(project: Project) {
    updateProject.mutate(
      { id: project.id, input: { status: 'ACTIVE' } },
      {
        onSuccess: () => toast.success(`Project ${project.code} restored`),
        onError: () => toast.error('Failed to restore project'),
      },
    );
  }

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: 'name',
      header: 'Project',
      cell: ({ row }) => (
        <div>
          <span className="font-medium text-fg">{row.original.name}</span>
          <span className="ml-1.5 font-mono text-xs text-fg-muted">{row.original.code}</span>
        </div>
      ),
    },
    {
      accessorKey: 'clientName',
      header: 'Client',
      cell: ({ row }) => <span className="text-fg-muted">{row.original.clientName || '—'}</span>,
    },
    {
      accessorKey: 'billable',
      header: 'Billing',
      cell: ({ row }) => {
        const cfg = row.original.billable ? BILLABLE_CONFIG.billable : BILLABLE_CONFIG.nonBillable;
        return (
          <span
            className={cn(
              'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
              cfg.color,
            )}
          >
            {cfg.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const cfg = PROJECT_STATUS_CONFIG[row.original.status];
        return (
          <span
            className={cn(
              'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
              cfg.color,
            )}
          >
            {cfg.label}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) =>
        canManage ? (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => openEdit(row.original)}
            >
              <PencilIcon className="size-3.5" aria-hidden />
              Edit
            </Button>
            {row.original.status === 'ACTIVE' ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-fg-muted"
                onClick={() => handleArchive(row.original)}
                disabled={deleteProject.isPending}
              >
                <ArchiveIcon className="size-3.5" aria-hidden />
                Archive
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-fg-muted"
                onClick={() => handleUnarchive(row.original)}
                disabled={updateProject.isPending}
              >
                <ArchiveRestoreIcon className="size-3.5" aria-hidden />
                Unarchive
              </Button>
            )}
          </div>
        ) : null,
    },
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-fg">Projects & tasks</h2>
          <p className="text-xs text-fg-muted">
            Projects employees log time against. Billable projects can be billed to a client.
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={openNew}>
            <PlusIcon className="size-3.5" aria-hidden />
            New project
          </Button>
        )}
      </div>

      <DynamicTable
        columns={columns}
        data={projects}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyTitle="No projects"
        emptyDescription="Create a project so employees can log time against it."
        emptyIllustration={<FolderKanbanIcon className="size-8 text-fg-muted" />}
      />

      {drawerOpen && (
        <ProjectDrawer
          key={editing?.id ?? 'new'}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          existing={editing}
        />
      )}
    </section>
  );
}
