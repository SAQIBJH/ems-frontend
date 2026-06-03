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
import { useAddAsset } from '../hooks/useAssets';
import { addAssetSchema, type AddAssetFormValues } from '../validations/add-asset.schema';
import type { AssetType } from '../types/assets.types';

const ASSET_TYPES: AssetType[] = ['Laptop', 'Monitor', 'Phone', 'Other'];

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAssetDialog({ open, onOpenChange }: AddAssetDialogProps) {
  const addAsset = useAddAsset();

  const form = useForm<AddAssetFormValues>({
    resolver: zodResolver(addAssetSchema),
    defaultValues: { tag: '', name: '', type: 'Laptop' },
  });

  const watchedType = useWatch({ control: form.control, name: 'type' });

  function handleClose() {
    form.reset();
    onOpenChange(false);
  }

  function onSubmit(values: AddAssetFormValues) {
    addAsset.mutate(values, {
      onSuccess: (asset) => {
        toast.success(`Asset ${asset.tag} added`);
        handleClose();
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to add asset';
        toast.error(msg);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add asset</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
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
