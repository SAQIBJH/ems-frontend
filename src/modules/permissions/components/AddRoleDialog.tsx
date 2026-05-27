'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusIcon } from 'lucide-react';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { ApiError } from '@/types/api';

import { useCreateRole } from '../hooks/usePermissionsMutations';
import { PERMISSION_GROUPS, PERMISSION_LABELS } from '../constants/permissions.constants';
import type { PermissionKey } from '../types/permissions.types';

const schema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  key: z
    .string()
    .min(2, 'Key must be at least 2 characters')
    .max(50, 'Key must be at most 50 characters')
    .regex(
      /^[A-Z][A-Z0-9_]*$/,
      'Key must start with a letter and contain only A–Z, 0–9, and underscores',
    ),
  permissions: z.array(z.string()).min(1, 'Select at least one permission'),
});

type FormValues = z.infer<typeof schema>;

function deriveKey(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

interface AddRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddRoleDialog({ open, onOpenChange }: AddRoleDialogProps) {
  const createRole = useCreateRole();
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', key: '', permissions: [] },
  });

  const nameValue = form.watch('name');
  const currentPermissions = form.watch('permissions');

  useEffect(() => {
    if (!keyManuallyEdited && nameValue) {
      form.setValue('key', deriveKey(nameValue), { shouldValidate: false });
    }
  }, [nameValue, keyManuallyEdited, form]);

  useEffect(() => {
    if (!open) {
      form.reset();
      setKeyManuallyEdited(false);
    }
  }, [open, form]);

  const togglePermission = (permission: string) => {
    const current = form.getValues('permissions');
    const next = current.includes(permission)
      ? current.filter((p) => p !== permission)
      : [...current, permission];
    form.setValue('permissions', next, { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    try {
      await createRole.mutateAsync({
        name: values.name,
        key: values.key,
        permissions: values.permissions as PermissionKey[],
      });
      onOpenChange(false);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const code = axiosErr.response?.data?.error?.code;
      const message = axiosErr.response?.data?.error?.message ?? 'Failed to create role';
      if (code === 'DUPLICATE_ROLE_KEY') {
        form.setError('key', { message });
      } else {
        form.setError('root', { message });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Custom Role</DialogTitle>
          <DialogDescription>
            Define a new role and select the permissions it grants.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            id="add-role-form"
            onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role name</FormLabel>
                  <Input placeholder="e.g. Recruiter" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role key</FormLabel>
                  <Input
                    placeholder="e.g. RECRUITER"
                    {...field}
                    onChange={(e) => {
                      setKeyManuallyEdited(true);
                      field.onChange(e.target.value.toUpperCase());
                    }}
                  />
                  <p className="text-xs text-fg-muted">
                    Uppercase letters, digits, and underscores only. Used internally.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permissions"
              render={() => (
                <FormItem>
                  <FormLabel>Permissions</FormLabel>
                  <ScrollArea className="h-52 rounded-md border border-subtle px-3 py-2">
                    <div className="space-y-3 pb-1">
                      {PERMISSION_GROUPS.map((group) => (
                        <div key={group.label}>
                          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-fg-subtle">
                            {group.label}
                          </p>
                          <div className="space-y-1.5 pl-1">
                            {group.permissions.map((permission) => (
                              <label
                                key={permission}
                                className="flex cursor-pointer items-center gap-2"
                              >
                                <Checkbox
                                  checked={currentPermissions.includes(permission)}
                                  onCheckedChange={() => togglePermission(permission)}
                                />
                                <span className="text-sm text-fg">
                                  {PERMISSION_LABELS[permission]}
                                </span>
                                <span className="font-mono text-xs text-fg-muted">
                                  {permission}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <p className="text-xs text-destructive">{form.formState.errors.root.message}</p>
            )}
          </form>
        </Form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createRole.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" form="add-role-form" disabled={createRole.isPending}>
            <PlusIcon className="size-3.5 mr-1.5" />
            {createRole.isPending ? 'Creating…' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
