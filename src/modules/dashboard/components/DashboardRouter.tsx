'use client';

import { useAuth } from '@/providers';
import { Skeleton } from '@/components/ui/skeleton';
import { HRDashboard } from './HRDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';

export function DashboardRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Skeleton className="h-80 w-full rounded-lg xl:col-span-2" />
          <Skeleton className="h-80 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (user.memberType === 'HR_ADMIN' || user.memberType === 'SUPER_ADMIN') {
    return <HRDashboard />;
  }

  if (user.memberType === 'MANAGER') {
    return <ManagerDashboard />;
  }

  return <EmployeeDashboard />;
}
