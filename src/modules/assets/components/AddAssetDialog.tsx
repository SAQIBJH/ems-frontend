'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWatch } from 'react-hook-form';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/types/api';
import { useAddAsset, useAssetEmployees } from '../hooks/useAssets';
import { addAssetSchema, type AddAssetFormValues } from '../validations/add-asset.schema';
import type { AssetType } from '../types/assets.types';

const ASSET_TYPES: AssetType[] = ['Laptop', 'Monitor', 'Phone', 'Other'];

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAssetDialog({ open, onOpenChange }: AddAssetDialogProps) {
  const addAsset = useAddAsset();
  const employeesQuery = useAssetEmployees();
  const employees = employeesQuery.data ?? [];

  const form = useForm<AddAssetFormValues>({
    resolver: zodResolver(addAssetSchema),
    defaultValues: { tag: '', name: '', type: 'Laptop', employeeId: '', since: '' },
  });

  const watchedType = useWatch({ control: form.control, name: 'type' });
  const watchedEmployeeId = useWatch({ control: form.control, name: 'employeeId' });

  function handleClose() {
    form.reset();
    onOpenChange(false);
  }

  function onSubmit(values: AddAssetFormValues) {
    const selectedEmp = employees.find((e) => e.employeeId === values.employeeId);

    addAsset.mutate(
      {
        tag: values.tag,
        name: values.name,
        type: values.type,
        ...(selectedEmp && values.since
          ? {
              assignedTo: { employeeId: selectedEmp.employeeId, name: selectedEmp.name },
              assignedSince: values.since,
            }
          : {}),
      },
      {
        onSuccess: (asset) => {
          toast.success(`Asset ${asset.tag} added`);
          handleClose();
        },
        onError: (err: unknown) => {
          const axiosErr = err as AxiosError<ApiError>;
          const status = axiosErr.response?.status;
          const apiError = axiosErr.response?.data?.error;

          if (status === 422 && Array.isArray(apiError?.details)) {
            apiError.details.forEach(({ field, message }: { field: string; message: string }) => {
              form.setError(field as keyof AddAssetFormValues, { message });
            });
            return;
          }
          if (status === 409) {
            form.setError('tag', { message: 'An asset with this tag already exists.' });
            return;
          }
          toast.error(apiError?.message ?? 'Failed to add asset. Please try again.');
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add asset</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={watchedType}
              onValueChange={(v) =>
                form.setValue('type', (v ?? 'Laptop') as AssetType, { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSET_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-xs text-danger">{form.formState.errors.type.message}</p>
            )}
          </div>

          {/* Tag */}
          <div className="space-y-1.5">
            <Label htmlFor="asset-tag">Asset tag</Label>
            <Input
              id="asset-tag"
              placeholder="e.g. LAP-0210"
              className="font-mono"
              {...form.register('tag')}
            />
            {form.formState.errors.tag && (
              <p className="text-xs text-danger">{form.formState.errors.tag.message}</p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="asset-name">Asset name</Label>
            <Input
              id="asset-name"
              placeholder='e.g. MacBook Pro 14" M4'
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-subtle pt-1">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
              Assign on creation <span className="normal-case font-normal">(optional)</span>
            </p>

            {/* Assign to */}
            <div className="space-y-1.5">
              <Label>Assign to</Label>
              <Select
                value={watchedEmployeeId ?? ''}
                onValueChange={(v) =>
                  form.setValue('employeeId', v === '__none__' ? '' : (v ?? ''), {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select employee…">
                    {(v) => employees.find((e) => e.employeeId === v)?.name ?? 'Select employee…'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Unassigned —</SelectItem>
                  {employees.map((e) => (
                    <SelectItem key={e.employeeId} value={e.employeeId}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Since — only shown when employee selected */}
            {watchedEmployeeId && (
              <div className="mt-3 space-y-1.5">
                <Label htmlFor="asset-since">Assigned since</Label>
                <Input
                  id="asset-since"
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  {...form.register('since')}
                />
                {form.formState.errors.since && (
                  <p className="text-xs text-danger">{form.formState.errors.since.message}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addAsset.isPending}>
              {addAsset.isPending ? 'Adding…' : 'Add asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
