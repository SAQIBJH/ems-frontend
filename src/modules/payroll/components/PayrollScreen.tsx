'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { parseAsString, useQueryState } from 'nuqs';
import { PlayIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { useAuth } from '@/providers';

import { PayrollRunsTab } from './PayrollRunsTab';
import { InitiateRunDialog } from './InitiateRunDialog';

type PayrollTab = 'runs' | 'my-payslips';

export function PayrollScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useQueryState('tab', parseAsString.withDefault('runs'));
  const [dialogOpen, setDialogOpen] = useState(false);

  const isEmployee = user?.memberType === 'EMPLOYEE' || user?.memberType === 'MANAGER';
  const isHrOrAdmin = user?.memberType === 'HR_ADMIN' || user?.memberType === 'SUPER_ADMIN';

  // Employees are redirected to self-service payslips
  useEffect(() => {
    if (isEmployee && !isHrOrAdmin) {
      router.replace('/payroll/my-payslips');
    }
  }, [isEmployee, isHrOrAdmin, router]);

  if (isEmployee && !isHrOrAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Payroll"
        breadcrumbs={[{ label: 'Payroll' }]}
        actions={
          isHrOrAdmin ? (
            <Button size="default" onClick={() => setDialogOpen(true)}>
              <PlayIcon className="size-3.5" aria-hidden />
              Run Payroll
            </Button>
          ) : undefined
        }
      />

      <div className="p-6 space-y-6">
        <Tabs value={activeTab} onValueChange={(v: string) => void setActiveTab(v as PayrollTab)}>
          <TabsList className="mb-6">
            {isHrOrAdmin && <TabsTrigger value="runs">Runs</TabsTrigger>}
          </TabsList>

          {isHrOrAdmin && (
            <TabsContent value="runs">
              <PayrollRunsTab onRunPayroll={() => setDialogOpen(true)} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      <InitiateRunDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
