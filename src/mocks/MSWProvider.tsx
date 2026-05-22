'use client';

import { useEffect } from 'react';
import { env } from '@/lib/env';

let initialized = false;

export function MSWProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (initialized || !env.NEXT_PUBLIC_USE_MOCKS) return;
    initialized = true;

    void import('./browser').then(({ worker }) => worker.start({ onUnhandledRequest: 'bypass' }));
  }, []);

  return <>{children}</>;
}
