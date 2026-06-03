'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, UserPlusIcon } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Asset } from '../types/assets.types';
import { ASSET_STATUS_CONFIG } from '../constants';
import {
  useUpdateAssetStatus,
  useAssignAsset,
  useRecallAsset,
  useAssetEmployees,
} from '../hooks/useAssets';
import { AssetGlyph } from './AssetGlyph';

function getInitials(name: string) {
  const p = name.trim().split(' ');
  return p.length >= 2
    ? `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function formatDate(d: string) {
  try {
    return format(parseISO(d), 'MMM d, yyyy');
  } catch {
    return d;
  }
}

interface Props {
  asset: Asset | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetDetailSheet({ asset, open, onOpenChange }: Props) {
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [since, setSince] = useState('');
  const [retireConfirmOpen, setRetireConfirmOpen] = useState(false);

  const employeesQuery = useAssetEmployees();
  const employees = employeesQuery.data ?? [];

  const updateStatus = useUpdateAssetStatus();
  const assignAsset = useAssignAsset();
  const recallAsset = useRecallAsset();

  if (!asset) return null;

  const sc = ASSET_STATUS_CONFIG[asset.status];

  function handleMarkAvailable() {
    updateStatus.mutate(
      { id: asset!.id, status: 'Available' },
      {
        onSuccess: () => {
          toast.success(`${asset!.tag} marked as available`);
          onOpenChange(false);
        },
        onError: () => toast.error('Failed to update status'),
      },
    );
  }

  function handleSendToRepair() {
    updateStatus.mutate(
      { id: asset!.id, status: 'Repair' },
      {
        onSuccess: () => {
          toast.success(`${asset!.tag} sent to repair`);
          onOpenChange(false);
        },
        onError: () => toast.error('Failed to update status'),
      },
    );
  }

  function handleRetire() {
    updateStatus.mutate(
      { id: asset!.id, status: 'Retired' },
      {
        onSuccess: () => {
          toast.success(`${asset!.tag} has been retired`);
          setRetireConfirmOpen(false);
          onOpenChange(false);
        },
        onError: () => toast.error('Failed to retire asset'),
      },
    );
  }

  function handleRecall() {
    recallAsset.mutate(asset!.id, {
      onSuccess: () => {
        toast.success(`${asset!.tag} recalled from ${asset!.assignedTo?.name}`);
        onOpenChange(false);
      },
      onError: () => toast.error('Failed to recall asset'),
    });
  }

  function handleAssign() {
    const emp = employees.find((e) => e.employeeId === selectedEmployeeId);
    if (!emp || !since) return;
    assignAsset.mutate(
      { id: asset!.id, input: { employeeId: emp.employeeId, name: emp.name, since } },
      {
        onSuccess: () => {
          toast.success(`${asset!.tag} assigned to ${emp.name}`);
          setShowAssignForm(false);
          setSelectedEmployeeId('');
          setSince('');
          onOpenChange(false);
        },
        onError: () => toast.error('Failed to assign asset'),
      },
    );
  }

  const isBusy = updateStatus.isPending || assignAsset.isPending || recallAsset.isPending;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex items-center gap-3">
              <AssetGlyph type={asset.type} />
              <div>
                <SheetTitle className="text-base">{asset.name}</SheetTitle>
                <SheetDescription className="font-mono text-xs">{asset.tag}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Details grid */}
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-y-3 rounded-lg border border-subtle bg-surface-2 p-4">
              <span className="text-fg-muted">Type</span>
              <span className="text-fg font-medium">{asset.type}</span>

              <span className="text-fg-muted">Status</span>
              <span>
                <Badge variant={sc.variant} dot>
                  {asset.status}
                </Badge>
              </span>

              <span className="text-fg-muted">Added</span>
              <span className="text-fg">{formatDate(asset.createdAt)}</span>
            </div>

            {/* Assignment section */}
            <div className="rounded-lg border border-subtle p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.05em] text-fg-muted">
                Assignment
              </p>

              {asset.assignedTo ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Avatar size="sm">
                      <AvatarFallback className="text-[10px] font-medium">
                        {getInitials(asset.assignedTo.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-[13px] font-medium text-fg">{asset.assignedTo.name}</p>
                      {asset.assignedSince && (
                        <p className="text-[11px] text-fg-muted flex items-center gap-1">
                          <CalendarIcon size={10} aria-hidden />
                          Since {asset.assignedSince}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled={isBusy} onClick={handleRecall}>
                    {recallAsset.isPending ? 'Recalling…' : 'Recall'}
                  </Button>
                </div>
              ) : (
                <p className="text-[13px] text-fg-muted">Not assigned</p>
              )}

              {/* Assign form toggle */}
              {asset.status !== 'Retired' && !asset.assignedTo && (
                <>
                  {!showAssignForm ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowAssignForm(true)}
                    >
                      <UserPlusIcon size={13} aria-hidden />
                      Assign to employee
                    </Button>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Employee</Label>
                        <Select
                          value={selectedEmployeeId}
                          onValueChange={(v) => setSelectedEmployeeId(v ?? '')}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select employee…" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((e) => (
                              <SelectItem key={e.employeeId} value={e.employeeId}>
                                {e.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs" htmlFor="since-date">
                          Since
                        </Label>
                        <Input
                          id="since-date"
                          type="date"
                          className="h-8 text-xs"
                          value={since}
                          onChange={(e) => setSince(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          disabled={!selectedEmployeeId || !since || isBusy}
                          onClick={handleAssign}
                        >
                          {assignAsset.isPending ? 'Assigning…' : 'Confirm assign'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowAssignForm(false);
                            setSelectedEmployeeId('');
                            setSince('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Status actions */}
            {asset.status !== 'Retired' && (
              <div className="rounded-lg border border-subtle p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.05em] text-fg-muted">
                  Actions
                </p>
                <div className="flex flex-wrap gap-2">
                  {asset.status === 'Assigned' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={handleMarkAvailable}
                    >
                      {updateStatus.isPending ? 'Updating…' : 'Mark available'}
                    </Button>
                  )}
                  {(asset.status === 'Available' || asset.status === 'Assigned') && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={handleSendToRepair}
                    >
                      {updateStatus.isPending ? 'Updating…' : 'Send to repair'}
                    </Button>
                  )}
                  {asset.status === 'Repair' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={handleMarkAvailable}
                    >
                      {updateStatus.isPending ? 'Updating…' : 'Mark available'}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => setRetireConfirmOpen(true)}
                  >
                    Retire asset
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={retireConfirmOpen} onOpenChange={setRetireConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retire {asset.tag}?</AlertDialogTitle>
            <AlertDialogDescription>
              This marks the asset as permanently retired. It can no longer be assigned or sent to
              repair.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={handleRetire}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? 'Retiring…' : 'Retire'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
