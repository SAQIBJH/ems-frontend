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
import { useAddGoal } from '../hooks/usePerformance';
import { addGoalSchema, type AddGoalFormValues } from '../validations/add-goal.schema';

interface AddGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGoalDialog({ open, onOpenChange }: AddGoalDialogProps) {
  const addGoal = useAddGoal();

  const form = useForm<AddGoalFormValues>({
    resolver: zodResolver(addGoalSchema),
    defaultValues: {
      employeeId: '',
      title: '',
      dueDate: '',
      progressPct: 0,
    },
  });

  function onSubmit(values: AddGoalFormValues) {
    addGoal.mutate(values, {
      onSuccess: () => {
        toast.success('Goal added');
        form.reset();
        onOpenChange(false);
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

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="goal-employee">Employee ID</Label>
            <Input id="goal-employee" placeholder="emp_1" {...form.register('employeeId')} />
            {form.formState.errors.employeeId && (
              <p className="text-xs text-danger">{form.formState.errors.employeeId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-title">Goal title</Label>
            <Input
              id="goal-title"
              placeholder="e.g. Reduce p95 API latency below 200ms"
              {...form.register('title')}
            />
            {form.formState.errors.title && (
              <p className="text-xs text-danger">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-due">Due date</Label>
            <Input id="goal-due" type="date" {...form.register('dueDate')} />
            {form.formState.errors.dueDate && (
              <p className="text-xs text-danger">{form.formState.errors.dueDate.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
