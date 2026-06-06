'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GlobeIcon, WalletIcon } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { useAuth } from '@/providers';

import { PayrollRunsTab } from './PayrollRunsTab';
import { InitiateRunDialog } from './InitiateRunDialog';

export function PayrollScreen() {
  const { user } = useAuth();
  const router = useRouter();
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
        description="Run monthly payroll, review past cycles, and manage disbursements."
        breadcrumbs={[{ label: 'Payroll' }]}
        actions={
          isHrOrAdmin ? (
            <div className="flex items-center gap-2">
              <Link
                href="/payroll/global"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                <GlobeIcon className="size-3.5" aria-hidden />
                Global Workforce
              </Link>
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                <WalletIcon className="size-3.5" aria-hidden />
                Run Payroll
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="p-6">
        <PayrollRunsTab onRunPayroll={() => setDialogOpen(true)} />
      </div>

      <InitiateRunDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
