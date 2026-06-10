import { AnalyticsPage } from '@/modules/analytics';
import { RoleGate } from '@/shared/guards';
import { ErrorState } from '@/components/feedback/ErrorState';

export const metadata = { title: 'Analytics' };

export default function Analytics() {
  return (
    <RoleGate
      roles={['SUPER_ADMIN', 'HR_ADMIN']}
      fallback={
        <div className="p-6">
          <ErrorState message="You do not have permission to view analytics. This area is restricted to HR and Super Admins." />
        </div>
      }
    >
      <AnalyticsPage />
    </RoleGate>
  );
}
