'use client';

import { Loader2Icon, AlertTriangleIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateOpening } from '../hooks/useRecruitment';
import type { Opening } from '../types/recruitment.types';

interface CloseOpeningDialogProps {
  opening: Opening | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloseOpeningDialog({ opening, open, onOpenChange }: CloseOpeningDialogProps) {
  const updateMutation = useUpdateOpening();

  const handleClose = () => {
    if (!opening) return;
    updateMutation.mutate(
      { id: opening.id, input: { status: 'Closed' } },
      {
        onSuccess: () => {
          toast.success(`"${opening.title}" has been closed.`);
          onOpenChange(false);
        },
        onError: () => toast.error('Failed to close opening'),
      },
    );
  };

  if (!opening) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger/10">
              <AlertTriangleIcon className="size-5 text-danger" aria-hidden />
            </div>
            <DialogTitle>Close opening?</DialogTitle>
          </div>
        </DialogHeader>

        <p className="text-[13px] text-fg-secondary leading-[20px]">
          This will mark <span className="font-medium text-fg">&ldquo;{opening.title}&rdquo;</span>{' '}
          as <span className="font-medium text-fg">Closed</span> and stop accepting new
          applications. This action can be undone by editing the opening.
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleClose} disabled={updateMutation.isPending}>
            {updateMutation.isPending && (
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
            )}
            Close opening
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
