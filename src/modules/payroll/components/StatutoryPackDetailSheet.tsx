'use client';

import { format, parseISO } from 'date-fns';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import { formatMoney } from '../utils/money.utils';
import type { StatutoryPack } from '../types/statutory.types';

interface StatutoryPackDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pack: StatutoryPack | null;
}

function fmtDate(iso: string) {
  return format(parseISO(iso), 'd MMM yyyy');
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-fg-muted">{children}</p>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="text-sm text-fg">{value}</p>
    </div>
  );
}

export function StatutoryPackDetailSheet({
  open,
  onOpenChange,
  pack,
}: StatutoryPackDetailSheetProps) {
  // Schemes/local-taxes/min-wages carry minor-unit amounts but no currency of
  // their own — display them in the pack's primary regime currency.
  const displayCurrency = pack?.taxRegimes[0]?.currency ?? 'USD';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:w-[560px] sm:max-w-[560px]"
      >
        <SheetHeader className="shrink-0 border-b border-subtle px-6 py-4">
          <SheetTitle>{pack ? `${pack.country} ${pack.version}` : 'Statutory Pack'}</SheetTitle>
        </SheetHeader>

        {pack && (
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* Overview */}
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Effective"
                value={`${fmtDate(pack.effectiveFrom)} → ${
                  pack.effectiveTo ? fmtDate(pack.effectiveTo) : 'Open'
                }`}
              />
              <Field
                label="Rounding"
                value={`${pack.rounding.mode.toLowerCase()} · precision ${pack.rounding.precision}`}
              />
              <Field
                label="Proration"
                value={pack.proration.basis.replace('_', ' ').toLowerCase()}
              />
              {pack.gratuity && (
                <Field
                  label="Gratuity"
                  value={`${pack.gratuity.daysPerYear} days/yr · ÷${pack.gratuity.monthDivisor} · min ${pack.gratuity.minYears} yrs`}
                />
              )}
            </div>

            {/* Tax regimes */}
            <div className="space-y-3">
              <SectionTitle>Tax regimes ({pack.taxRegimes.length})</SectionTitle>
              {pack.taxRegimes.map((r) => (
                <div key={r.code} className="rounded-lg border border-subtle">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle px-3 py-2">
                    <span className="font-mono text-xs font-medium text-fg">{r.code}</span>
                    <span className="text-xs text-fg-muted">
                      FY {r.fiscalYear} · {r.currency} · std deduction{' '}
                      {formatMoney(r.standardDeduction, r.currency)}
                    </span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-subtle text-fg-muted">
                        <th className="px-3 py-1.5 text-left font-medium">From</th>
                        <th className="px-3 py-1.5 text-left font-medium">To</th>
                        <th className="px-3 py-1.5 text-right font-medium">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.slabs.map((s, i) => (
                        <tr key={i} className="border-b border-subtle last:border-0">
                          <td className="px-3 py-1.5 tabular-nums text-fg-muted">
                            {formatMoney(s.from, r.currency)}
                          </td>
                          <td className="px-3 py-1.5 tabular-nums text-fg-muted">
                            {s.to === null ? '—' : formatMoney(s.to, r.currency)}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-fg">{s.rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {(r.cess || (r.surcharge && r.surcharge.length > 0)) && (
                    <div className="border-t border-subtle px-3 py-1.5 text-xs text-fg-muted">
                      {r.cess ? `Cess ${r.cess.rate}%` : ''}
                      {r.cess && r.surcharge?.length ? ' · ' : ''}
                      {r.surcharge?.length ? `${r.surcharge.length} surcharge band(s)` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Contribution schemes */}
            <div className="space-y-3">
              <SectionTitle>Contribution schemes ({pack.contributionSchemes.length})</SectionTitle>
              {pack.contributionSchemes.length === 0 ? (
                <p className="text-sm text-fg-muted">None.</p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-subtle">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-subtle bg-surface-raised/40 text-fg-muted">
                        <th className="px-3 py-1.5 text-left font-medium">Scheme</th>
                        <th className="px-3 py-1.5 text-left font-medium">Wage tag</th>
                        <th className="px-3 py-1.5 text-right font-medium">EE / ER</th>
                        <th className="px-3 py-1.5 text-right font-medium">Ceiling</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pack.contributionSchemes.map((s) => (
                        <tr key={s.code} className="border-b border-subtle last:border-0">
                          <td className="px-3 py-1.5 text-fg">{s.name}</td>
                          <td className="px-3 py-1.5 font-mono text-fg-muted">{s.wageBaseTag}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-fg">
                            {s.employee.rate}% / {s.employer.rate}%
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-fg-muted">
                            {s.wageCeiling === null
                              ? 'Uncapped'
                              : formatMoney(s.wageCeiling, displayCurrency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Local taxes */}
            <div className="space-y-3">
              <SectionTitle>Local taxes ({pack.localTaxes.length})</SectionTitle>
              {pack.localTaxes.length === 0 ? (
                <p className="text-sm text-fg-muted">None.</p>
              ) : (
                <div className="space-y-1.5">
                  {pack.localTaxes.map((t) => (
                    <div
                      key={t.code}
                      className="flex items-center justify-between rounded-lg border border-subtle px-3 py-2 text-xs"
                    >
                      <span className="text-fg">{t.name}</span>
                      <span className="font-mono text-fg-muted">
                        {t.jurisdiction ? `${t.jurisdiction} · ` : ''}
                        {t.slabs.length} band{t.slabs.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Minimum wages */}
            {pack.minimumWages && pack.minimumWages.length > 0 && (
              <div className="space-y-3">
                <SectionTitle>Minimum wages ({pack.minimumWages.length})</SectionTitle>
                <div className="space-y-1.5">
                  {pack.minimumWages.map((w) => (
                    <div
                      key={w.jurisdiction}
                      className="flex items-center justify-between rounded-lg border border-subtle px-3 py-2 text-xs"
                    >
                      <span className="font-mono text-fg-muted">{w.jurisdiction}</span>
                      <span className="tabular-nums text-fg">
                        {formatMoney(w.monthlyFloor, displayCurrency)} / mo
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Statutory components */}
            <div className="space-y-3">
              <SectionTitle>Statutory components ({pack.statutoryComponents.length})</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {pack.statutoryComponents.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center rounded bg-surface-raised px-2 py-0.5 font-mono text-xs text-fg-muted"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
