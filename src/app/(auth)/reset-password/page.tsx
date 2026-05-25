import { Suspense } from 'react';
import { ResetPasswordForm } from '@/modules/auth';

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
