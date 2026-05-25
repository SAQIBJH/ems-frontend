'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { Loader2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ApiError } from '@/types/api';

import {
  departmentCreateSchema,
  type DepartmentCreateFormValues,
} from '../validations/department.schema';
import { useCreateDepartment, useUpdateDepartment } from '../hooks/useDepartmentMutations';
import type { Department } from '../types/department.types';
import { flattenDepartmentTree } from '../utils/department.utils';

interface DepartmentFormProps {
  mode: 'create' | 'edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDept?: Department | null;
  parentId?: string;
  departments: Department[];
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

export function DepartmentForm({
  mode,
  open,
  onOpenChange,
  initialDept,
  parentId,
  departments,
}: DepartmentFormProps) {
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();

  const flatDepts = flattenDepartmentTree(departments);

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DepartmentCreateFormValues>({
    resolver: zodResolver(departmentCreateSchema),
    defaultValues: { name: '', departmentCode: '', parentId: parentId ?? '' },
  });

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialDept) {
        reset({
          name: initialDept.name,
          departmentCode: initialDept.departmentCode,
          parentId: initialDept.parentId ?? '',
        });
      } else {
        reset({ name: '', departmentCode: '', parentId: parentId ?? '' });
      }
    }
  }, [open, mode, initialDept, parentId, reset]);

  async function onSubmit(values: DepartmentCreateFormValues) {
    const payload = {
      name: values.name,
      departmentCode: values.departmentCode,
      parentId: values.parentId || null,
    };

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
        toast.success('Department created.');
      } else {
        await updateMutation.mutateAsync({ id: initialDept!.id, ...payload });
        toast.success('Department updated.');
      }
      onOpenChange(false);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const status = axiosErr.response?.status;
      const apiError = axiosErr.response?.data?.error;

      if (status === 422 && Array.isArray(apiError?.details)) {
        apiError.details.forEach(({ field, message }: { field: string; message: string }) => {
          setError(field as keyof DepartmentCreateFormValues, { message });
        });
        return;
      }

      if (status === 409) {
        if (apiError?.code === 'DUPLICATE_CODE') {
          setError('departmentCode', { message: 'This code is already taken.' });
          return;
        }
        if (apiError?.code === 'DEPARTMENT_CYCLE') {
          setError('parentId', {
            message: 'Setting this parent would create a circular reference.',
          });
          return;
        }
      }

      if (status === 400 && apiError?.code === 'INVALID_PARENT') {
        setError('parentId', { message: 'Parent department not found.' });
        return;
      }

      toast.error(apiError?.message ?? 'Failed to save department. Please try again.');
    }
  }

  const isPending = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New department' : 'Edit department'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="dept-name">
              Name{' '}
              <span className="text-destructive" aria-hidden>
                *
              </span>
            </Label>
            <Input
              id="dept-name"
              placeholder="Engineering"
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dept-code">
              Code{' '}
              <span className="text-destructive" aria-hidden>
                *
              </span>
            </Label>
            <Input
              id="dept-code"
              placeholder="ENG"
              aria-invalid={!!errors.departmentCode}
              {...register('departmentCode')}
            />
            <p className="text-xs text-fg-muted">2–10 characters. Used in reports and exports.</p>
            <FieldError message={errors.departmentCode?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dept-parent-trigger">Parent department</Label>
            <Controller
              control={control}
              name="parentId"
              render={({ field }) => (
                <Select
                  value={field.value ?? ''}
                  onValueChange={(v) => field.onChange(v === '_none' ? '' : v)}
                >
                  <SelectTrigger id="dept-parent-trigger" className="w-full">
                    <SelectValue placeholder="None (root department)">
                      {(v) =>
                        v === '_none' || v === ''
                          ? 'None (root department)'
                          : (flatDepts.find((d) => d.id === v)?.name ?? v)
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None (root department)</SelectItem>
                    {flatDepts
                      .filter((d) => (mode === 'edit' ? d.id !== initialDept?.id : true))
                      .map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.depth > 0 ? `${'—'.repeat(d.depth)} ` : ''}
                          {d.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.parentId?.message} />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} aria-busy={isPending}>
              {isPending && <Loader2Icon className="mr-1.5 size-3.5 animate-spin" aria-hidden />}
              {mode === 'create' ? 'Create department' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
