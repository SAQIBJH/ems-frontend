'use client';

import type { ReactNode } from 'react';
import { Label } from '@/components/ui/label';

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

export function FormFieldWrapper({
  id,
  label,
  required,
  description,
  error,
  children,
  colSpan,
}: {
  id: string;
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  children: ReactNode;
  colSpan?: 1 | 2;
}) {
  return (
    <div className={colSpan === 2 ? 'space-y-1.5 md:col-span-2' : 'space-y-1.5'}>
      <Label htmlFor={id}>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden>
            {' '}
            *
          </span>
        )}
      </Label>
      {children}
      {description && !error && <p className="text-xs text-fg-muted">{description}</p>}
      <FieldError message={error} />
    </div>
  );
}
