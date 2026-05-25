'use client';

import Link from 'next/link';
import { Loader2Icon } from 'lucide-react';

import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FormFooterProps {
  submitLabel?: string;
  cancelHref?: string;
  onCancel?: () => void;
  isPending?: boolean;
}

export function FormFooter({
  submitLabel = 'Save',
  cancelHref,
  onCancel,
  isPending = false,
}: FormFooterProps) {
  return (
    <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-subtle bg-canvas/95 px-6 py-4 backdrop-blur-sm">
      {cancelHref ? (
        <Link
          href={cancelHref}
          className={cn(buttonVariants({ variant: 'outline', size: 'default' }))}
          aria-disabled={isPending}
        >
          Cancel
        </Link>
      ) : onCancel ? (
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      ) : null}
      <Button type="submit" size="default" disabled={isPending} aria-busy={isPending}>
        {isPending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
        {submitLabel}
      </Button>
    </div>
  );
}
