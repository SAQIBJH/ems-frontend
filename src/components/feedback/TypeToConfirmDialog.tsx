'use client';

import { useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TypeToConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** The exact string the user must type to unlock the confirm button. */
  confirmText: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
}

export function TypeToConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading: externalLoading,
}: TypeToConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState('');
  const [internalLoading, setInternalLoading] = useState(false);

  const isPending = internalLoading || (externalLoading ?? false);
  const isMatch = typedValue === confirmText;

  async function handleConfirm() {
    if (isPending || !isMatch) return;
    const result = onConfirm();
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
      } finally {
        setInternalLoading(false);
      }
    }
  }

  function handleCancel() {
    if (isPending) return;
    onCancel?.();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isPending) {
          if (!isOpen) setTypedValue('');
          onOpenChange(isOpen);
        }
      }}
    >
      <DialogContent showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <p className="text-sm text-fg-muted">
            Type{' '}
            <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs text-fg">
              {confirmText}
            </code>{' '}
            to confirm.
          </p>
          <Input
            value={typedValue}
            onChange={(e) => setTypedValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isMatch) void handleConfirm();
            }}
            placeholder={confirmText}
            disabled={isPending}
            aria-label={`Type ${confirmText} to confirm`}
            autoComplete="off"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={isPending || !isMatch}
            aria-busy={isPending}
          >
            {isPending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
