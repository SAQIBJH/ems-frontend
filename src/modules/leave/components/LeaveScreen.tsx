'use client';

import { parseAsString, useQueryState } from 'nuqs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { useAuth } from '@/providers';

import { LeaveRequestsTable } from './LeaveRequestsTable';
import { LeaveApprovalsTable } from './LeaveApprovalsTable';
import { LeaveTeamCalendar } from './LeaveTeamCalendar';
import { LeaveBalanceCards } from './LeaveBalanceCards';

type Tab = 'my-requests' | 'approvals' | 'team-calendar' | 'balances';

const TABS: { value: Tab; label: string }[] = [
  { value: 'my-requests', label: 'My Requests' },
  { value: 'approvals', label: 'Approvals' },
  { value: 'team-calendar', label: 'Team Calendar' },
  { value: 'balances', label: 'Balances' },
];

export function LeaveScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useQueryState('tab', parseAsString.withDefault('my-requests'));

  const canApprove =
    user?.memberType === 'MANAGER' ||
    user?.memberType === 'HR_ADMIN' ||
    user?.memberType === 'SUPER_ADMIN';

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Leave"
        description="Manage leave requests, approvals, and your available balance."
        breadcrumbs={[{ label: 'Leave' }]}
      />

      <div className="p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={(v: string) => void setActiveTab(v)}>
          <TabsList>
            {TABS.map((tab) => {
              if ((tab.value === 'approvals' || tab.value === 'team-calendar') && !canApprove) {
                return null;
              }
              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="my-requests" className="mt-4">
            <LeaveRequestsTable />
          </TabsContent>

          {canApprove && (
            <TabsContent value="approvals" className="mt-4">
              <LeaveApprovalsTable />
            </TabsContent>
          )}

          {canApprove && (
            <TabsContent value="team-calendar" className="mt-4">
              <LeaveTeamCalendar />
            </TabsContent>
          )}

          <TabsContent value="balances" className="mt-4">
            <LeaveBalanceCards />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
