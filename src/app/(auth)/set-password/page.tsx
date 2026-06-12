import { Suspense } from 'react';
import { SetPasswordForm } from '@/modules/auth';

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm />
    </Suspense>
  );
}
