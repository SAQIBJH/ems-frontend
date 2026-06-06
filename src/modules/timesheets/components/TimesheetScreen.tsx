'use client';

import { parseAsString, useQueryState } from 'nuqs';
import { ClockIcon } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { EmptyState } from '@/components/feedback/EmptyState';

import { useTimesheetPermissions } from '../hooks/useTimesheetPermissions';
import { ProjectsPanel } from './ProjectsPanel';

export function TimesheetScreen() {
  const perms = useTimesheetPermissions();
  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('my'));

  const tabs = [
    { value: 'my', label: 'My Timesheet', show: perms.canWrite },
    { value: 'approvals', label: 'Approvals', show: perms.canApprove },
    { value: 'projects', label: 'Projects', show: perms.canAdmin },
  ].filter((t) => t.show);

  const valid = tabs.some((t) => t.value === tab) ? tab : (tabs[0]?.value ?? 'my');

  return (
    <>
      <PageHeader
        title="Timesheets"
        description="Log hours against projects, submit your week, and track approvals."
        breadcrumbs={[{ label: 'Timesheets' }]}
      />

      <div className="p-6">
        <Tabs value={valid} onValueChange={(v) => setTab(v)}>
          <TabsList variant="line" className="mb-4 w-full justify-start">
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="my">
            <EmptyState
              title="Weekly timesheet coming next"
              description="The weekly time-entry grid arrives in the next step."
              illustration={<ClockIcon className="size-8 text-fg-muted" />}
            />
          </TabsContent>

          <TabsContent value="approvals">
            <EmptyState
              title="Approvals coming soon"
              description="Submitted timesheets will appear here for review."
              illustration={<ClockIcon className="size-8 text-fg-muted" />}
            />
          </TabsContent>

          <TabsContent value="projects">
            <ProjectsPanel canManage={perms.canAdmin} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
