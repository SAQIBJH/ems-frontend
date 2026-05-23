import { PermissionsMatrix } from '@/modules/permissions';
import { RoleGate } from '@/shared/guards';
import { ErrorState } from '@/components/feedback/ErrorState';

export const metadata = { title: 'Permissions' };

export default function PermissionsPage() {
  return (
    <RoleGate
      roles={['SUPER_ADMIN']}
      fallback={
        <div className="p-6">
          <ErrorState message="You do not have permission to manage roles and permissions. This area is restricted to Super Admins." />
        </div>
      }
    >
      <PermissionsMatrix />
    </RoleGate>
  );
}
