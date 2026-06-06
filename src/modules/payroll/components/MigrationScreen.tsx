'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { parseAsString, useQueryState } from 'nuqs';
import { ArrowLeftIcon } from 'lucide-react';

import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { useAuth } from '@/providers';
import { usePayrollPermissions } from '@/modules/payroll';

import { PayCalendarPanel } from './migration/PayCalendarPanel';
import { OpeningBalancesPanel } from './migration/OpeningBalancesPanel';
import { HistoricalPayslipsPanel } from './migration/HistoricalPayslipsPanel';
import { ParallelReconcilePanel } from './migration/ParallelReconcilePanel';
import { GoLivePanel } from './migration/GoLivePanel';

const TABS = [
  { value: 'calendar', label: 'Pay Calendar' },
  { value: 'opening', label: 'Opening Balances' },
  { value: 'historical', label: 'Historical Payslips' },
  { value: 'parallel', label: 'Parallel Run' },
  { value: 'golive', label: 'Go-Live' },
] as const;

export function MigrationScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const perms = usePayrollPermissions();
  const isHrOrAdmin = user?.memberType === 'HR_ADMIN' || user?.memberType === 'SUPER_ADMIN';

  const [tab, setTab] = useQueryState('tab', parseAsString.withDefault('calendar'));

  // Migration is an admin-only onboarding tool.
  useEffect(() => {
    if (user && !isHrOrAdmin) router.replace('/payroll');
  }, [user, isHrOrAdmin, router]);

  if (user && !isHrOrAdmin) return null;

  const canManage = perms.canInitiate || perms.canAdjust;
  const active = TABS.some((t) => t.value === tab) ? tab : 'calendar';

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Onboarding & Migration"
        description="Bring payroll live: pay calendar, opening balances, historical payslips, and a parallel run before cutover."
        breadcrumbs={[{ label: 'Payroll', href: '/payroll' }, { label: 'Migration' }]}
        actions={
          <Link href="/payroll" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            <ArrowLeftIcon className="size-3.5" aria-hidden />
            Back to Payroll
          </Link>
        }
      />

      <div className="p-6">
        <Tabs value={active} onValueChange={(v) => setTab(v)}>
          <TabsList className="mb-4">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="calendar">
            <PayCalendarPanel canManage={canManage} />
          </TabsContent>
          <TabsContent value="opening">
            <OpeningBalancesPanel canManage={canManage} />
          </TabsContent>
          <TabsContent value="historical">
            <HistoricalPayslipsPanel canManage={canManage} />
          </TabsContent>
          <TabsContent value="parallel">
            <ParallelReconcilePanel />
          </TabsContent>
          <TabsContent value="golive">
            <GoLivePanel canManage={canManage} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
