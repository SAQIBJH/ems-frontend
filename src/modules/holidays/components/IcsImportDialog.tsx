'use client';

import { useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { UploadIcon, CheckIcon, AlertTriangleIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ApiError } from '@/types/api';

import { holidaysApi } from '../services/holidays.api';
import type { IcsImportPreview } from '../types/holiday.types';

type Step = 'pick' | 'preview';

interface IcsImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful commit so the parent can refetch holidays */
  onImported: () => void;
}

export function IcsImportDialog({ open, onOpenChange, onImported }: IcsImportDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('pick');
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState('');
  const [preview, setPreview] = useState<IcsImportPreview | null>(null);
  const [committing, setCommitting] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const job = await holidaysApi.startImport(file);
      setJobId(job.jobId);
      const prev = await holidaysApi.getImportPreview(job.jobId);
      setPreview(prev);
      setStep('preview');
    } catch (err) {
      const axErr = err as AxiosError<ApiError>;
      toast.error(axErr.response?.data?.error?.message ?? 'Failed to parse .ics file');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleCommit() {
    if (!preview) return;
    setCommitting(true);
    try {
      const result = await holidaysApi.commitImport(jobId, true);
      const msg =
        `Imported ${result.imported} holiday${result.imported !== 1 ? 's' : ''}` +
        (result.overwritten > 0 ? `, updated ${result.overwritten}` : '');
      toast.success(msg);
      onImported();
      handleClose(false);
    } catch (err) {
      const axErr = err as AxiosError<ApiError>;
      toast.error(axErr.response?.data?.error?.message ?? 'Import failed');
    } finally {
      setCommitting(false);
    }
  }

  function reset() {
    setStep('pick');
    setPreview(null);
    setJobId('');
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleClose(isOpen: boolean) {
    if (!isOpen) reset();
    onOpenChange(isOpen);
  }

  const totalToImport = preview ? preview.summary.new + preview.summary.overwrites : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import .ics Calendar</DialogTitle>
          <DialogDescription>
            Upload an iCalendar (.ics) file to bulk-import holidays.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1 — file picker */}
        {step === 'pick' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div
              className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-subtle p-10 text-center transition-colors hover:border-brand/50"
              onClick={() => !uploading && fileRef.current?.click()}
            >
              <UploadIcon className="size-8 text-fg-subtle" />
              <div>
                <p className="text-sm font-medium text-fg">Choose a .ics file</p>
                <p className="text-xs text-fg-subtle mt-0.5">iCalendar format · max 1 MB</p>
              </div>
              {uploading && <p className="text-xs text-brand animate-pulse">Parsing file…</p>}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".ics,text/calendar"
              className="hidden"
              onChange={(e) => void handleFileSelect(e)}
              disabled={uploading}
            />
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={uploading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Step 2 — preview */}
        {step === 'preview' && preview && (
          <div className="space-y-4">
            {/* Summary chips */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-success/15 text-success px-2.5 py-0.5 font-medium">
                {preview.summary.new} new
              </span>
              {preview.summary.overwrites > 0 && (
                <span className="rounded-full bg-warning/15 text-warning px-2.5 py-0.5 font-medium">
                  {preview.summary.overwrites} will overwrite
                </span>
              )}
              {preview.summary.skipped > 0 && (
                <span className="rounded-full bg-surface-raised text-fg-subtle px-2.5 py-0.5 font-medium">
                  {preview.summary.skipped} skipped
                </span>
              )}
            </div>

            {/* Candidates table */}
            <div className="max-h-60 overflow-y-auto rounded-lg border border-subtle">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-surface-raised">
                  <tr className="border-b border-subtle">
                    <th className="px-3 py-2 text-left font-medium text-fg-subtle">Date</th>
                    <th className="px-3 py-2 text-left font-medium text-fg-subtle">Name</th>
                    <th className="px-3 py-2 text-left font-medium text-fg-subtle">Type</th>
                    <th className="px-3 py-2 text-left font-medium text-fg-subtle">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.candidates.map((c, i) => (
                    <tr
                      key={i}
                      className="border-b border-subtle last:border-0 hover:bg-surface-raised/40"
                    >
                      <td className="px-3 py-2 tabular-nums text-fg-subtle">
                        {format(parseISO(c.date), 'dd MMM')}
                      </td>
                      <td className="px-3 py-2 font-medium text-fg">{c.name}</td>
                      <td className="px-3 py-2">
                        {c.isOptional ? (
                          <Badge
                            variant="outline"
                            className="text-info border-info/30 bg-info/10 py-0 text-[10px]"
                          >
                            Optional
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-success border-success/30 bg-success/10 py-0 text-[10px]"
                          >
                            Public
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {c.willOverwrite ? (
                          <span className="flex items-center gap-1 text-warning">
                            <AlertTriangleIcon className="size-3" />
                            Overwrite
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-success">
                            <CheckIcon className="size-3" />
                            New
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {preview.summary.overwrites > 0 && (
              <p className="text-xs text-fg-subtle">
                Existing holidays on the same date will be overwritten.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset} disabled={committing}>
                Back
              </Button>
              <Button onClick={() => void handleCommit()} disabled={committing}>
                {committing
                  ? 'Importing…'
                  : `Import ${totalToImport} Holiday${totalToImport !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
