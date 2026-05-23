'use client';

import type { ReactNode } from 'react';
import { Separator } from '@/components/ui/separator';

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        <Separator />
      </div>
      {children}
    </div>
  );
}
