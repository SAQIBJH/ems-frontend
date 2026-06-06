'use client';

import { useState } from 'react';
import { DownloadIcon, Loader2Icon, FileTextIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { payrollRunsApi, STATUTORY_RETURN_OPTIONS } from '@/modules/payroll';
import type { StatutoryReturnType } from '@/modules/payroll';

/**
 * Statutory filing returns for a run (§12). The format is driven by the pinned pack +
 * a template registry server-side — this panel just picks a return and downloads it.
 */
export function StatutoryFilingPanel({ runId }: { runId: string }) {
  const [type, setType] = useState<StatutoryReturnType>('ECR');
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await payrollRunsApi.exportStatutoryReturn(runId, type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statutory-return-${runId}-${type}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export statutory return');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileTextIcon className="size-4 text-fg-muted" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-fg">Statutory returns</h3>
            <p className="text-xs text-fg-muted">
              Pack-driven filing exports — PF ECR, TDS 24Q, UK RTI.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={type} onValueChange={(v) => v && setType(v as StatutoryReturnType)}>
            <SelectTrigger className="w-[260px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUTORY_RETURN_OPTIONS.map((o) => (
                <SelectItem key={o.type} value={o.type}>
                  {o.label} · {o.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <DownloadIcon className="size-3.5" aria-hidden />
            )}
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
