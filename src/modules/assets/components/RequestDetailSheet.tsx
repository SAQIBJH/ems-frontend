'use client';

import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { AssetRequest } from '../types/assets.types';
import { REQUEST_STATUS_CONFIG } from '../constants';
import { useApproveRequest, useDeclineRequest } from '../hooks/useAssets';

function getInitials(name: string) {
  const p = name.trim().split(' ');
  return p.length >= 2
    ? `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

interface Props {
  request: AssetRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestDetailSheet({ request, open, onOpenChange }: Props) {
  const approve = useApproveRequest();
  const decline = useDeclineRequest();

  if (!request) return null;

  const sc = REQUEST_STATUS_CONFIG[request.status];
  const isPending = request.status === 'Pending';
  const isBusy = approve.isPending || decline.isPending;

  function handleApprove() {
    approve.mutate(request!.id, {
      onSuccess: () => {
        toast.success(`Request for "${request!.item}" approved`);
        onOpenChange(false);
      },
      onError: () => toast.error('Failed to approve request'),
    });
  }

  function handleDecline() {
    decline.mutate(
      { id: request!.id },
      {
        onSuccess: () => {
          toast.success(`Request for "${request!.item}" declined`);
          onOpenChange(false);
        },
        onError: () => toast.error('Failed to decline request'),
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader className="mb-6">
          <SheetTitle>Asset request</SheetTitle>
          <SheetDescription>Submitted {request.requestedAt}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 text-sm">
          {/* Requestor */}
          <div className="flex items-center gap-3 rounded-lg border border-subtle bg-surface-2 p-4">
            <Avatar>
              <AvatarFallback className="text-xs font-medium">
                {getInitials(request.requestedBy.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[13px] font-medium text-fg">{request.requestedBy.name}</p>
              <p className="text-[11px] text-fg-muted">Employee</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 rounded-lg border border-subtle p-4">
            <span className="text-fg-muted">Item</span>
            <span className="font-medium text-fg">{request.item}</span>

            <span className="text-fg-muted">Reason</span>
            <span className="text-fg">{request.reason}</span>

            <span className="text-fg-muted">Requested</span>
            <span className="font-mono text-[12px] text-fg-muted">{request.requestedAt}</span>

            <span className="text-fg-muted">Status</span>
            <span>
              <Badge variant={sc.variant} dot>
                {request.status}
              </Badge>
            </span>
          </div>

          {/* Actions */}
          {isPending && (
            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={handleDecline}
                className="flex-1"
              >
                {decline.isPending ? 'Declining…' : 'Decline'}
              </Button>
              <Button size="sm" disabled={isBusy} onClick={handleApprove} className="flex-1">
                {approve.isPending ? 'Approving…' : 'Approve'}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
