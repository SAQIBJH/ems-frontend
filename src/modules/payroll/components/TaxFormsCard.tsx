'use client';

import { useState } from 'react';
import { FileTextIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { TAX_FORM_OPTIONS } from '@/modules/payroll';
import type { TaxFormType } from '@/modules/payroll';
import { TaxFormDrawer } from './TaxFormDrawer';

/** India fiscal years (Apr–Mar), labelled `YYYY-YY` to match the payroll engine. */
function fiscalYearOptions(): string[] {
  const now = new Date();
  const startYear = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  return [0, 1, 2, 3].map((n) => {
    const sy = startYear - n;
    return `${sy}-${String((sy + 1) % 100).padStart(2, '0')}`;
  });
}

interface TaxFormsCardProps {
  employeeId: string;
}

export function TaxFormsCard({ employeeId }: TaxFormsCardProps) {
  const fyOptions = fiscalYearOptions();
  const [type, setType] = useState<TaxFormType>('FORM16');
  const [fiscalYear, setFiscalYear] = useState(fyOptions[0]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="rounded-lg border border-subtle bg-surface">
      <div className="flex items-center gap-2 border-b border-subtle px-4 py-3">
        <FileTextIcon className="size-4 text-fg-muted" aria-hidden />
        <div>
          <h3 className="text-sm font-semibold text-fg">Tax Forms</h3>
          <p className="text-xs text-fg-muted">
            Generate your annual statement from year-to-date payroll records.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 px-4 py-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-fg-muted" htmlFor="tax-form-type">
            Form
          </label>
          <Select value={type} onValueChange={(v) => v && setType(v as TaxFormType)}>
            <SelectTrigger id="tax-form-type" className="w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAX_FORM_OPTIONS.map((o) => (
                <SelectItem key={o.type} value={o.type}>
                  {o.label} · {o.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-fg-muted" htmlFor="tax-form-fy">
            Fiscal year
          </label>
          <Select value={fiscalYear} onValueChange={(v) => v && setFiscalYear(v)}>
            <SelectTrigger id="tax-form-fy" className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fyOptions.map((fy) => (
                <SelectItem key={fy} value={fy}>
                  {fy}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={() => setDrawerOpen(true)}>
          <FileTextIcon className="size-3.5" aria-hidden />
          Generate form
        </Button>
      </div>

      <TaxFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        employeeId={employeeId}
        type={type}
        fiscalYear={fiscalYear}
      />
    </div>
  );
}
