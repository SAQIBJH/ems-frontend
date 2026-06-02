'use client';

import { useState } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { CalendarPlusIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { useAuth } from '@/providers';

import { LeaveRequestsTable } from './LeaveRequestsTable';
import { LeaveApprovalsTable } from './LeaveApprovalsTable';
import { LeaveTeamCalendar } from './LeaveTeamCalendar';
import { NewLeaveRequestDialog } from './NewLeaveRequestDialog';

type Tab = 'my-requests' | 'team-calendar' | 'approvals';

export function LeaveScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useQueryState('tab', parseAsString.withDefault('my-requests'));
  const [newRequestOpen, setNewRequestOpen] = useState(false);

  const canApprove =
    user?.memberType === 'MANAGER' ||
    user?.memberType === 'HR_ADMIN' ||
    user?.memberType === 'SUPER_ADMIN';

  const tabs: { value: Tab; label: string }[] = [
    { value: 'my-requests', label: 'My Requests' },
    { value: 'team-calendar', label: 'Team Calendar' },
    ...(canApprove ? [{ value: 'approvals' as Tab, label: 'Approvals' }] : []),
  ];

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Leave"
        description="Requests, approvals, and your available balance."
        breadcrumbs={[{ label: 'Leave' }]}
        actions={
          <Button size="sm" onClick={() => setNewRequestOpen(true)}>
            <CalendarPlusIcon className="mr-1.5 size-4 shrink-0" aria-hidden />
            New Request
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={(v: string) => void setActiveTab(v)}>
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="my-requests" className="mt-4">
            <LeaveRequestsTable onNewRequest={() => setNewRequestOpen(true)} />
          </TabsContent>

          <TabsContent value="team-calendar" className="mt-4">
            <LeaveTeamCalendar />
          </TabsContent>

          {canApprove && (
            <TabsContent value="approvals" className="mt-4">
              <LeaveApprovalsTable />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <NewLeaveRequestDialog open={newRequestOpen} onOpenChange={setNewRequestOpen} />
    </div>
  );
}
