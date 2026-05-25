import { Suspense } from 'react';
import { OtpVerificationForm } from '@/modules/auth';

export default function OtpVerificationPage() {
  return (
    <Suspense>
      <OtpVerificationForm />
    </Suspense>
  );
}
