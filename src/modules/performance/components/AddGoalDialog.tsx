'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { useAddGoal, usePerformanceEmployees } from '../hooks/usePerformance';

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  title: z.string().min(1, 'Goal title is required').max(200, 'Title too long'),
  dueDate: z.string().min(1, 'Due date is required'),
  progressPct: z.number().min(0).max(100),
});

type FormValues = z.infer<typeof schema>;

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGoalDialog({ open, onOpenChange }: AddGoalDialogProps) {
  const addGoal = useAddGoal();
  const employeesQuery = usePerformanceEmployees();
  const employees = employeesQuery.data ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { employeeId: '', title: '', dueDate: '', progressPct: 0 },
  });

  const watchedEmployeeId = useWatch({ control: form.control, name: 'employeeId' });

  function handleClose() {
    form.reset();
    onOpenChange(false);
  }

  function onSubmit(values: FormValues) {
    addGoal.mutate(values, {
      onSuccess: () => {
        toast.success('Goal added');
        handleClose();
      },
      onError: () => toast.error('Failed to add goal'),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add goal</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Employee select */}
          <div className="space-y-1.5">
            <Label>Employee</Label>
            <Select
              value={watchedEmployeeId}
              onValueChange={(v) => form.setValue('employeeId', v ?? '', { shouldValidate: true })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select employee…" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                    <span className="ml-1.5 text-xs text-fg-muted">· {e.department}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.employeeId && (
              <p className="text-xs text-danger">{form.formState.errors.employeeId.message}</p>
            )}
          </div>

          {/* Goal title */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-title">Goal</Label>
            <Input
              id="goal-title"
              placeholder="e.g. Reduce p95 API latency below 200ms"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-danger">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <Label htmlFor="goal-due">Due date</Label>
            <Input id="goal-due" type="date" {...form.register('dueDate')} />
            {form.formState.errors.dueDate && (
              <p className="text-xs text-danger">{form.formState.errors.dueDate.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={addGoal.isPending}>
              {addGoal.isPending ? 'Adding…' : 'Add goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
