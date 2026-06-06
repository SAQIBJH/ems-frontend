'use client';

import { useState } from 'react';
import { DownloadIcon, Loader2Icon, ShieldCheckIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { payrollComplianceApi } from '@/modules/payroll';

/**
 * Audit assurance pack (§21) — immutable run history, approval chain, config-version
 * pin, and the override/action log, exported as JSON for internal/external audit.
 */
export function AuditPackPanel({ runId }: { runId: string }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await payrollComplianceApi.downloadAuditPack(runId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-pack-${runId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download audit pack');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-subtle bg-surface px-4 py-3">
      <div className="flex items-center gap-2">
        <ShieldCheckIcon className="size-4 text-fg-muted" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-fg">Audit assurance pack</h3>
          <p className="text-xs text-fg-muted">
            Run history, approval chain, pinned config version & override log.
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
        {downloading ? (
          <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <DownloadIcon className="size-3.5" aria-hidden />
        )}
        Export pack
      </Button>
    </div>
  );
}
