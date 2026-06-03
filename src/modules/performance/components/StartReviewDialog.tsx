'use client';

import { useState } from 'react';
import { StarIcon } from 'lucide-react';
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

interface StartReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartReviewDialog({ open, onOpenChange }: StartReviewDialogProps) {
  const [cycleName, setCycleName] = useState('');
  const [selfDue, setSelfDue] = useState('');
  const [managerDue, setManagerDue] = useState('');
  const [calibrationDate, setCalibrationDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleClose() {
    setCycleName('');
    setSelfDue('');
    setManagerDue('');
    setCalibrationDate('');
    onOpenChange(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cycleName || !selfDue || !managerDue || !calibrationDate) {
      toast.error('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    // Simulate async action — no backend endpoint yet
    setTimeout(() => {
      setSubmitting(false);
      toast.success(`Review cycle "${cycleName}" started`);
      handleClose();
    }, 600);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div
              className="grid size-8 shrink-0 place-items-center rounded-lg"
              style={{
                background: 'color-mix(in oklab, var(--brand-500) 14%, transparent)',
                color: 'var(--brand-500)',
              }}
            >
              <StarIcon className="size-4" aria-hidden />
            </div>
            <DialogTitle>Start a review cycle</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="cycle-name">Cycle name</Label>
            <Input
              id="cycle-name"
              placeholder="e.g. H2 2026 Review Cycle"
              value={cycleName}
              onChange={(e) => setCycleName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="self-due">Self-review due date</Label>
            <Input
              id="self-due"
              type="date"
              value={selfDue}
              onChange={(e) => setSelfDue(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mgr-due">Manager review due date</Label>
            <Input
              id="mgr-due"
              type="date"
              value={managerDue}
              onChange={(e) => setManagerDue(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cal-date">Calibration date</Label>
            <Input
              id="cal-date"
              type="date"
              value={calibrationDate}
              onChange={(e) => setCalibrationDate(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Starting…' : 'Start cycle'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
