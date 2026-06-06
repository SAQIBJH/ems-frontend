'use client';

import { PrinterIcon } from 'lucide-react';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';

import { useTaxForm } from '@/modules/payroll';
import type { TaxFormType, TaxFormDocument, TaxFormParty } from '@/modules/payroll';

interface TaxFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string | null;
  type: TaxFormType;
  fiscalYear: string;
}

export function TaxFormDrawer({
  open,
  onOpenChange,
  employeeId,
  type,
  fiscalYear,
}: TaxFormDrawerProps) {
  const { data, isLoading, isError, refetch } = useTaxForm(employeeId, type, fiscalYear, open);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b border-subtle pb-3">
          <SheetTitle>{data ? data.title : 'Tax Form'}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="space-y-3 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full rounded" />
              ))}
            </div>
          )}

          {isError && !isLoading && (
            <div className="p-4">
              <ErrorState message="Failed to generate tax form" onRetry={() => refetch()} />
            </div>
          )}

          {data && !isLoading && <TaxFormContent document={data} />}
        </div>

        {data && !isLoading && (
          <div className="no-print shrink-0 border-t border-subtle p-4">
            <Button
              variant="outline"
              size="default"
              className="w-full"
              onClick={() => window.print()}
            >
              <PrinterIcon className="size-3.5" aria-hidden />
              Download PDF
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function PartyBlock({ label, party }: { label: string; party: TaxFormParty }) {
  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
        {label}
      </p>
      <p className="text-sm font-medium text-fg">{party.name}</p>
      {party.subtitle && <p className="text-xs text-fg-muted">{party.subtitle}</p>}
      {party.identifiers.map((id) => (
        <p key={id.label} className="mt-0.5 text-xs text-fg-muted">
          {id.label}: <span className="font-mono text-fg">{id.value}</span>
        </p>
      ))}
    </div>
  );
}

function TaxFormContent({ document }: { document: TaxFormDocument }) {
  return (
    <div className="payslip-print-root space-y-5 px-4 py-4 text-sm">
      {/* Form header */}
      <div className="border-b border-subtle pb-4">
        <p className="font-semibold text-fg">{document.title}</p>
        <p className="text-xs text-fg-muted">{document.authority}</p>
        <p className="mt-1 text-xs font-medium text-fg-muted">
          Fiscal year {document.fiscalYear} · {document.jurisdiction}
        </p>
      </div>

      {/* Parties */}
      <div className="grid grid-cols-2 gap-4">
        <PartyBlock label="Employer" party={document.employer} />
        <PartyBlock label="Employee" party={document.employee} />
      </div>

      {/* Sections */}
      {document.sections.map((section) => (
        <section key={section.title}>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            {section.title}
          </h3>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-subtle">
              {section.rows.map((row) => (
                <tr key={row.label}>
                  <td className="py-1.5 text-fg">{row.label}</td>
                  <td className="py-1.5 text-right tabular-nums text-fg">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}

      <p className="border-t border-subtle pt-3 text-[10px] text-fg-muted">
        Computer-generated statement — generated from year-to-date payroll records.
      </p>
    </div>
  );
}
