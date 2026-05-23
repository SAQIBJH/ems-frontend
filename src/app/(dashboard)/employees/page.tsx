import Link from 'next/link';
import { PlusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { PermissionWrapper } from '@/shared/guards/PermissionWrapper';
import { EmployeeTable } from '@/modules/employees';

export default function EmployeesPage() {
  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage your organization's employee directory."
        breadcrumbs={[{ label: 'Employees' }]}
        actions={
          <PermissionWrapper permission="employees:write">
            <Link href="/employees/new" className={cn(buttonVariants({ size: 'sm' }), 'gap-1')}>
              <PlusIcon className="size-4 shrink-0" aria-hidden />
              Add employee
            </Link>
          </PermissionWrapper>
        }
      />
      <div className="px-6 py-6">
        <EmployeeTable />
      </div>
    </>
  );
}
