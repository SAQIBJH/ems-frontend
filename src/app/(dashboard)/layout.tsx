import { AppShell } from '@/shared/layouts/AppShell';
import { AuthGuard } from '@/shared/guards';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
