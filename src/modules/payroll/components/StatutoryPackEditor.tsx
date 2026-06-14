'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, PlusIcon, Trash2Icon, TriangleAlertIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import { useCreateStatutoryPack, useUpdateStatutoryPack } from '../hooks/useLocalization';
import { fromMinor, toMinor } from '../utils/money.utils';
import {
  EDITOR_TAB_FIELDS,
  statutoryPackEditorSchema,
} from '../validations/statutory-pack-editor.schema';
import type {
  EditorTab,
  StatutoryPackEditorValues,
} from '../validations/statutory-pack-editor.schema';
import type { StatutoryPack, StatutoryPackInput } from '../types/statutory.types';

type EditorForm = UseFormReturn<StatutoryPackEditorValues>;

const ROUNDING_LABEL: Record<StatutoryPackEditorValues['roundingMode'], string> = {
  NEAREST: 'Nearest',
  UP: 'Round up',
  DOWN: 'Round down',
};

const PRORATION_LABEL: Record<StatutoryPackEditorValues['prorationBasis'], string> = {
  CALENDAR_DAYS: 'Calendar days',
  WORKING_DAYS: 'Working days',
  FIXED_30: 'Fixed 30 days',
};

const TAB_ORDER: EditorTab[] = [
  'general',
  'regimes',
  'contributions',
  'local',
  'minwage',
  'components',
];

const TAB_LABEL: Record<EditorTab, string> = {
  general: 'General',
  regimes: 'Tax Regimes',
  contributions: 'Contributions',
  local: 'Local Taxes',
  minwage: 'Min Wages',
  components: 'Components',
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function bumpVersion(v: string): string {
  const m = v.match(/^(.*?)(\d+)(\D*)$/);
  return m ? `${m[1]}${Number(m[2]) + 1}${m[3]}` : `${v}-copy`;
}

function rangesOverlap(aFrom: string, aTo: string | null, bFrom: string, bTo: string | null) {
  return aFrom <= (bTo ?? '9999-12-31') && bFrom <= (aTo ?? '9999-12-31');
}

function parseSplit(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  text.split('\n').forEach((line) => {
    const i = line.indexOf('=');
    if (i > 0) {
      const k = line.slice(0, i).trim();
      const n = Number(line.slice(i + 1).trim());
      if (k && !Number.isNaN(n)) out[k] = n;
    }
  });
  return out;
}

function serializeSplit(rec: Record<string, number>): string {
  return Object.entries(rec)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

/* ── Adapters: wire shape (minor units) ↔ form shape (major units) ──────────── */

function blankForm(): StatutoryPackEditorValues {
  return {
    country: '',
    version: '',
    effectiveFrom: todayIso(),
    effectiveTo: null,
    currency: 'INR',
    roundingMode: 'NEAREST',
    roundingPrecision: 0,
    prorationBasis: 'CALENDAR_DAYS',
    taxRegimes: [
      {
        code: '',
        fiscalYear: '',
        currency: 'INR',
        standardDeduction: 0,
        cessRate: null,
        slabs: [{ from: 0, to: null, rate: 0 }],
        surcharges: [],
        allowedExemptions: [],
      },
    ],
    contributionSchemes: [],
    localTaxes: [],
    minimumWages: [],
    statutoryComponents: [],
  };
}

function packToForm(pack: StatutoryPack, mode: 'edit' | 'clone'): StatutoryPackEditorValues {
  const currency = pack.taxRegimes[0]?.currency ?? 'USD';
  return {
    country: pack.country,
    version: mode === 'clone' ? bumpVersion(pack.version) : pack.version,
    effectiveFrom: mode === 'clone' ? todayIso() : pack.effectiveFrom,
    effectiveTo: mode === 'clone' ? null : pack.effectiveTo,
    currency,
    roundingMode: pack.rounding.mode,
    roundingPrecision: pack.rounding.precision,
    prorationBasis: pack.proration.basis,
    taxRegimes: pack.taxRegimes.map((r) => ({
      code: r.code,
      fiscalYear: r.fiscalYear,
      currency: r.currency,
      standardDeduction: fromMinor(r.standardDeduction, r.currency),
      cessRate: r.cess ? r.cess.rate : null,
      slabs: r.slabs.map((s) => ({
        from: fromMinor(s.from, r.currency),
        to: s.to === null ? null : fromMinor(s.to, r.currency),
        rate: s.rate,
      })),
      surcharges: (r.surcharge ?? []).map((su) => ({
        thresholdAnnual: fromMinor(su.thresholdAnnual, r.currency),
        rate: su.rate,
      })),
      allowedExemptions: r.allowedExemptions ?? [],
    })),
    contributionSchemes: pack.contributionSchemes.map((s) => ({
      code: s.code,
      name: s.name,
      wageBaseTag: s.wageBaseTag,
      wageCeiling: s.wageCeiling === null ? null : fromMinor(s.wageCeiling, currency),
      apportionmentMode: s.apportionmentMode ?? 'MONTHLY_TOTAL',
      applicability: s.applicability ?? '',
      employeeRate: s.employee.rate,
      employeeComponent: s.employee.component,
      employerRate: s.employer.rate,
      employerComponent: s.employer.component,
      employerSplit: s.employer.split ?? {},
    })),
    localTaxes: pack.localTaxes.map((t) => ({
      code: t.code,
      name: t.name,
      jurisdiction: t.jurisdiction ?? '',
      component: t.component,
      slabs: t.slabs.map((b) => ({
        from: fromMinor(b.from, currency),
        to: b.to === null ? null : fromMinor(b.to, currency),
        amount: fromMinor(b.amount, currency),
      })),
    })),
    minimumWages: (pack.minimumWages ?? []).map((w) => ({
      jurisdiction: w.jurisdiction,
      monthlyFloor: fromMinor(w.monthlyFloor, currency),
    })),
    statutoryComponents: [...pack.statutoryComponents],
  };
}

function formToInput(v: StatutoryPackEditorValues): StatutoryPackInput {
  const cur = v.currency;
  return {
    country: v.country.toUpperCase(),
    version: v.version,
    effectiveFrom: v.effectiveFrom,
    effectiveTo: v.effectiveTo,
    rounding: { mode: v.roundingMode, precision: v.roundingPrecision },
    proration: { basis: v.prorationBasis },
    taxRegimes: v.taxRegimes.map((r) => ({
      code: r.code,
      fiscalYear: r.fiscalYear,
      currency: r.currency,
      standardDeduction: toMinor(r.standardDeduction, r.currency),
      slabs: r.slabs.map((s) => ({
        from: toMinor(s.from, r.currency),
        to: s.to === null ? null : toMinor(s.to, r.currency),
        rate: s.rate,
      })),
      surcharge: r.surcharges.length
        ? r.surcharges.map((su) => ({
            thresholdAnnual: toMinor(su.thresholdAnnual, r.currency),
            rate: su.rate,
          }))
        : undefined,
      cess: r.cessRate === null ? null : { rate: r.cessRate },
      allowedExemptions: r.allowedExemptions.length ? r.allowedExemptions : undefined,
    })),
    contributionSchemes: v.contributionSchemes.map((s) => ({
      code: s.code,
      name: s.name,
      wageBaseTag: s.wageBaseTag,
      wageCeiling: s.wageCeiling === null ? null : toMinor(s.wageCeiling, cur),
      employee: { rate: s.employeeRate, component: s.employeeComponent },
      employer: {
        rate: s.employerRate,
        component: s.employerComponent,
        split: Object.keys(s.employerSplit).length ? s.employerSplit : undefined,
      },
      apportionmentMode: s.apportionmentMode,
      applicability: s.applicability || undefined,
    })),
    localTaxes: v.localTaxes.map((t) => ({
      code: t.code,
      name: t.name,
      jurisdiction: t.jurisdiction || undefined,
      component: t.component,
      slabs: t.slabs.map((b) => ({
        from: toMinor(b.from, cur),
        to: b.to === null ? null : toMinor(b.to, cur),
        amount: toMinor(b.amount, cur),
      })),
    })),
    minimumWages: v.minimumWages.length
      ? v.minimumWages.map((w) => ({
          jurisdiction: w.jurisdiction,
          monthlyFloor: toMinor(w.monthlyFloor, cur),
        }))
      : undefined,
    statutoryComponents: v.statutoryComponents,
  };
}

/* ── Small presentational helpers ───────────────────────────────────────────── */

function NumberCell({
  value,
  onChange,
  nullable = false,
  placeholder,
  error,
  className,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  nullable?: boolean;
  placeholder?: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Input
        type="number"
        step="any"
        value={value === null || value === undefined || Number.isNaN(value) ? '' : value}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === '' ? (nullable ? null : NaN) : Number(raw));
        }}
        placeholder={placeholder}
        className="tabular-nums"
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="mt-1 text-xs text-danger">{msg}</p> : null;
}

function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  function add() {
    const t = draft.trim().toUpperCase();
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft('');
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="font-mono uppercase"
        />
        <Button type="button" variant="outline" size="sm" onClick={add} className="shrink-0">
          Add
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 rounded bg-surface-raised px-2 py-0.5 font-mono text-xs text-fg-muted"
            >
              {t}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== t))}
                className="text-fg-muted hover:text-danger"
                aria-label={`Remove ${t}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const TH = 'px-2 py-1.5 text-left text-[11px] font-medium text-fg-muted';

/* ── Tax regime card (nested slabs + surcharges) ────────────────────────────── */

function RegimeCard({
  form,
  index,
  onRemove,
}: {
  form: EditorForm;
  index: number;
  onRemove: () => void;
}) {
  const { control, register, formState } = form;
  const slabs = useFieldArray({ control, name: `taxRegimes.${index}.slabs` });
  const surcharges = useFieldArray({ control, name: `taxRegimes.${index}.surcharges` });
  const err = formState.errors.taxRegimes?.[index];

  return (
    <div className="rounded-lg border border-subtle">
      <div className="flex items-center justify-between gap-2 border-b border-subtle px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
          Regime {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-fg-muted hover:text-danger"
          onClick={onRemove}
          aria-label={`Remove regime ${index + 1}`}
        >
          <Trash2Icon className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div className="space-y-4 px-3 py-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Code</Label>
            <Input
              {...register(`taxRegimes.${index}.code`)}
              placeholder="IN_NEW_REGIME"
              className="font-mono"
            />
            <FieldError msg={err?.code?.message} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fiscal year</Label>
            <Input {...register(`taxRegimes.${index}.fiscalYear`)} placeholder="2026-27" />
            <FieldError msg={err?.fiscalYear?.message} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Currency</Label>
            <Input
              {...register(`taxRegimes.${index}.currency`, {
                setValueAs: (v: string) => (v ? v.toUpperCase() : ''),
              })}
              placeholder="INR"
              maxLength={3}
              className="font-mono uppercase"
            />
            <FieldError msg={err?.currency?.message} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Std deduction</Label>
            <Controller
              control={control}
              name={`taxRegimes.${index}.standardDeduction`}
              render={({ field, fieldState }) => (
                <NumberCell
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="75000"
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cess % (blank = none)</Label>
            <Controller
              control={control}
              name={`taxRegimes.${index}.cessRate`}
              render={({ field, fieldState }) => (
                <NumberCell
                  value={field.value}
                  onChange={field.onChange}
                  nullable
                  placeholder="4"
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>
        </div>

        {/* Slabs */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Tax slabs (annual, in major units)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => slabs.append({ from: 0, to: null, rate: 0 })}
            >
              <PlusIcon className="size-3" aria-hidden />
              Slab
            </Button>
          </div>
          {typeof err?.slabs?.message === 'string' && (
            <p className="text-xs text-danger">{err.slabs.message}</p>
          )}
          <div className="overflow-hidden rounded-md border border-subtle">
            <table className="w-full">
              <thead className="bg-surface-raised/40">
                <tr>
                  <th className={TH}>From</th>
                  <th className={TH}>To (blank = ∞)</th>
                  <th className={TH}>Rate %</th>
                  <th className={cn(TH, 'w-9')} />
                </tr>
              </thead>
              <tbody>
                {slabs.fields.map((f, si) => (
                  <tr key={f.id} className="border-t border-subtle">
                    <td className="px-2 py-1.5 align-top">
                      <Controller
                        control={control}
                        name={`taxRegimes.${index}.slabs.${si}.from`}
                        render={({ field, fieldState }) => (
                          <NumberCell
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="0"
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </td>
                    <td className="px-2 py-1.5 align-top">
                      <Controller
                        control={control}
                        name={`taxRegimes.${index}.slabs.${si}.to`}
                        render={({ field, fieldState }) => (
                          <NumberCell
                            value={field.value}
                            onChange={field.onChange}
                            nullable
                            placeholder="∞"
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </td>
                    <td className="px-2 py-1.5 align-top">
                      <Controller
                        control={control}
                        name={`taxRegimes.${index}.slabs.${si}.rate`}
                        render={({ field, fieldState }) => (
                          <NumberCell
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="0"
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-fg-muted hover:text-danger"
                        onClick={() => slabs.remove(si)}
                        disabled={slabs.fields.length === 1}
                        aria-label={`Remove slab ${si + 1}`}
                      >
                        <Trash2Icon className="size-3.5" aria-hidden />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Surcharges */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Surcharges (optional)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => surcharges.append({ thresholdAnnual: 0, rate: 0 })}
            >
              <PlusIcon className="size-3" aria-hidden />
              Surcharge
            </Button>
          </div>
          {surcharges.fields.map((f, ui) => (
            <div key={f.id} className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-[11px] text-fg-muted">Above annual income</Label>
                <Controller
                  control={control}
                  name={`taxRegimes.${index}.surcharges.${ui}.thresholdAnnual`}
                  render={({ field, fieldState }) => (
                    <NumberCell
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="5000000"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
              <div className="w-24 space-y-1">
                <Label className="text-[11px] text-fg-muted">Rate %</Label>
                <Controller
                  control={control}
                  name={`taxRegimes.${index}.surcharges.${ui}.rate`}
                  render={({ field, fieldState }) => (
                    <NumberCell
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="10"
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 text-fg-muted hover:text-danger"
                onClick={() => surcharges.remove(ui)}
                aria-label={`Remove surcharge ${ui + 1}`}
              >
                <Trash2Icon className="size-3.5" aria-hidden />
              </Button>
            </div>
          ))}
        </div>

        {/* Allowed exemptions */}
        <div className="space-y-1">
          <Label className="text-xs">Allowed exemptions</Label>
          <Controller
            control={control}
            name={`taxRegimes.${index}.allowedExemptions`}
            render={({ field }) => (
              <TagInput value={field.value} onChange={field.onChange} placeholder="80C" />
            )}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Local tax card (nested bands) ──────────────────────────────────────────── */

function LocalTaxCard({
  form,
  index,
  onRemove,
}: {
  form: EditorForm;
  index: number;
  onRemove: () => void;
}) {
  const { control, register, formState } = form;
  const bands = useFieldArray({ control, name: `localTaxes.${index}.slabs` });
  const err = formState.errors.localTaxes?.[index];

  return (
    <div className="rounded-lg border border-subtle">
      <div className="flex items-center justify-between gap-2 border-b border-subtle px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
          Local tax {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 text-fg-muted hover:text-danger"
          onClick={onRemove}
          aria-label={`Remove local tax ${index + 1}`}
        >
          <Trash2Icon className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div className="space-y-4 px-3 py-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Code</Label>
            <Input {...register(`localTaxes.${index}.code`)} placeholder="IN_MH_PT" />
            <FieldError msg={err?.code?.message} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input {...register(`localTaxes.${index}.name`)} placeholder="Professional Tax (MH)" />
            <FieldError msg={err?.name?.message} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">
              Jurisdiction <span className="text-fg-muted">(optional)</span>
            </Label>
            <Input
              {...register(`localTaxes.${index}.jurisdiction`)}
              placeholder="IN-MH"
              className="font-mono"
            />
            <FieldError msg={err?.jurisdiction?.message} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Posts to component</Label>
            <Input
              {...register(`localTaxes.${index}.component`, {
                setValueAs: (v: string) => (v ? v.toUpperCase() : ''),
              })}
              placeholder="PROF_TAX"
              className="font-mono uppercase"
            />
            <FieldError msg={err?.component?.message} />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Bands (monthly wage → flat amount)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => bands.append({ from: 0, to: null, amount: 0 })}
            >
              <PlusIcon className="size-3" aria-hidden />
              Band
            </Button>
          </div>
          {typeof err?.slabs?.message === 'string' && (
            <p className="text-xs text-danger">{err.slabs.message}</p>
          )}
          <div className="overflow-hidden rounded-md border border-subtle">
            <table className="w-full">
              <thead className="bg-surface-raised/40">
                <tr>
                  <th className={TH}>From</th>
                  <th className={TH}>To (blank = ∞)</th>
                  <th className={TH}>Amount</th>
                  <th className={cn(TH, 'w-9')} />
                </tr>
              </thead>
              <tbody>
                {bands.fields.map((f, bi) => (
                  <tr key={f.id} className="border-t border-subtle">
                    <td className="px-2 py-1.5 align-top">
                      <Controller
                        control={control}
                        name={`localTaxes.${index}.slabs.${bi}.from`}
                        render={({ field, fieldState }) => (
                          <NumberCell
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="0"
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </td>
                    <td className="px-2 py-1.5 align-top">
                      <Controller
                        control={control}
                        name={`localTaxes.${index}.slabs.${bi}.to`}
                        render={({ field, fieldState }) => (
                          <NumberCell
                            value={field.value}
                            onChange={field.onChange}
                            nullable
                            placeholder="∞"
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </td>
                    <td className="px-2 py-1.5 align-top">
                      <Controller
                        control={control}
                        name={`localTaxes.${index}.slabs.${bi}.amount`}
                        render={({ field, fieldState }) => (
                          <NumberCell
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="200"
                            error={fieldState.error?.message}
                          />
                        )}
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right align-top">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 text-fg-muted hover:text-danger"
                        onClick={() => bands.remove(bi)}
                        disabled={bands.fields.length === 1}
                        aria-label={`Remove band ${bi + 1}`}
                      >
                        <Trash2Icon className="size-3.5" aria-hidden />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main editor ────────────────────────────────────────────────────────────── */

interface StatutoryPackEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit' | 'clone';
  pack: StatutoryPack | null;
  allPacks: StatutoryPack[];
}

export function StatutoryPackEditor({
  open,
  onOpenChange,
  mode,
  pack,
  allPacks,
}: StatutoryPackEditorProps) {
  const isEdit = mode === 'edit';
  const createMutation = useCreateStatutoryPack();
  const updateMutation = useUpdateStatutoryPack();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [tab, setTab] = useState<EditorTab>('general');

  const form = useForm<StatutoryPackEditorValues>({
    resolver: zodResolver(statutoryPackEditorSchema),
    defaultValues: blankForm(),
  });

  const regimes = useFieldArray({ control: form.control, name: 'taxRegimes' });
  const schemes = useFieldArray({ control: form.control, name: 'contributionSchemes' });
  const locals = useFieldArray({ control: form.control, name: 'localTaxes' });
  const minwages = useFieldArray({ control: form.control, name: 'minimumWages' });

  useEffect(() => {
    if (!open) return;
    setTab('general');
    form.reset(pack && mode !== 'create' ? packToForm(pack, mode) : blankForm());
  }, [open, mode, pack]); // eslint-disable-line react-hooks/exhaustive-deps

  const country = form.watch('country');
  const effectiveFrom = form.watch('effectiveFrom');
  const effectiveTo = form.watch('effectiveTo');

  const overlapWarning = useMemo(() => {
    const cc = (country || '').toUpperCase();
    if (!cc) return null;
    const clash = allPacks.find(
      (p) =>
        p.id !== (isEdit ? pack?.id : undefined) &&
        p.country === cc &&
        rangesOverlap(p.effectiveFrom, p.effectiveTo, effectiveFrom, effectiveTo),
    );
    return clash
      ? `Effective window overlaps ${cc} ${clash.version}. End-date that version first.`
      : null;
  }, [allPacks, country, effectiveFrom, effectiveTo, isEdit, pack]);

  const errs = form.formState.errors as Record<string, unknown>;
  const tabHasError = (t: EditorTab) => EDITOR_TAB_FIELDS[t].some((f) => errs[f] != null);

  function submit(values: StatutoryPackEditorValues) {
    const input = formToInput(values);
    const onError = (err: unknown) => {
      const apiErr = (err as AxiosError<{ error: { code: string; message: string } }>).response
        ?.data?.error;
      if (apiErr?.code === 'PACK_VERSION_EXISTS') {
        setTab('general');
        form.setError('version', { message: apiErr.message });
      } else if (apiErr?.code === 'INVALID_PACK') {
        setTab('general');
        form.setError('effectiveFrom', { message: apiErr.message });
      } else {
        toast.error(apiErr?.message ?? 'Failed to save statutory pack');
      }
    };

    if (isEdit && pack) {
      updateMutation.mutate(
        { id: pack.id, ...input },
        {
          onSuccess: () => {
            toast.success('Statutory pack updated');
            onOpenChange(false);
          },
          onError,
        },
      );
    } else {
      createMutation.mutate(input, {
        onSuccess: () => {
          toast.success('Statutory pack created');
          onOpenChange(false);
        },
        onError,
      });
    }
  }

  function onInvalid(errors: typeof form.formState.errors) {
    const errored = errors as Record<string, unknown>;
    const first = TAB_ORDER.find((t) => EDITOR_TAB_FIELDS[t].some((f) => errored[f] != null));
    if (first) setTab(first);
    toast.error('Please fix the highlighted fields');
  }

  const title =
    mode === 'edit'
      ? `Edit Pack — ${pack?.country} ${pack?.version}`
      : mode === 'clone'
        ? 'Clone Statutory Pack'
        : 'New Statutory Pack';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[88vh] w-full max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <DialogHeader className="shrink-0 border-b border-subtle px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit(submit, onInvalid)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as EditorTab)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList className="mx-6 mt-3 shrink-0 flex-wrap">
              {TAB_ORDER.map((t) => (
                <TabsTrigger key={t} value={t} className="gap-1.5">
                  {TAB_LABEL[t]}
                  {tabHasError(t) && (
                    <span className="size-1.5 rounded-full bg-danger" aria-hidden />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {/* General */}
              <TabsContent value="general" className="mt-0 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pk-country">Country</Label>
                    <Input
                      id="pk-country"
                      {...form.register('country', {
                        setValueAs: (v: string) => (v ? v.toUpperCase() : ''),
                      })}
                      readOnly={isEdit}
                      maxLength={2}
                      placeholder="IN"
                      className={cn(
                        'font-mono uppercase',
                        isEdit && 'cursor-not-allowed opacity-60',
                      )}
                    />
                    <FieldError msg={form.formState.errors.country?.message} />
                    {isEdit && (
                      <p className="text-xs text-fg-muted">Country is fixed for a pack.</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pk-version">Version</Label>
                    <Input
                      id="pk-version"
                      {...form.register('version')}
                      placeholder="2026.2"
                      className="font-mono"
                    />
                    <FieldError msg={form.formState.errors.version?.message} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pk-from">Effective from</Label>
                    <Input id="pk-from" type="date" {...form.register('effectiveFrom')} />
                    <FieldError msg={form.formState.errors.effectiveFrom?.message} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pk-to">
                      Effective to{' '}
                      <span className="font-normal text-fg-muted">(open if blank)</span>
                    </Label>
                    <Controller
                      control={form.control}
                      name="effectiveTo"
                      render={({ field }) => (
                        <Input
                          id="pk-to"
                          type="date"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      )}
                    />
                    <FieldError msg={form.formState.errors.effectiveTo?.message} />
                  </div>
                </div>

                {overlapWarning && (
                  <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs text-warning">
                    <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span>{overlapWarning}</span>
                  </div>
                )}

                <hr className="border-subtle" />

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="pk-currency">Pack currency</Label>
                    <Input
                      id="pk-currency"
                      {...form.register('currency', {
                        setValueAs: (v: string) => (v ? v.toUpperCase() : ''),
                      })}
                      placeholder="INR"
                      maxLength={3}
                      className="font-mono uppercase"
                    />
                    <FieldError msg={form.formState.errors.currency?.message} />
                    <p className="text-xs text-fg-muted">
                      Used for schemes, local taxes &amp; wages.
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pk-rounding">Rounding</Label>
                    <Controller
                      control={form.control}
                      name="roundingMode"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger id="pk-rounding" className="w-full cursor-pointer">
                            <SelectValue>
                              {(v) =>
                                ROUNDING_LABEL[v as StatutoryPackEditorValues['roundingMode']] ?? v
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {(
                              Object.keys(ROUNDING_LABEL) as Array<keyof typeof ROUNDING_LABEL>
                            ).map((m) => (
                              <SelectItem key={m} value={m}>
                                {ROUNDING_LABEL[m]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pk-precision">Precision</Label>
                    <Input
                      id="pk-precision"
                      type="number"
                      min={0}
                      max={4}
                      {...form.register('roundingPrecision', { valueAsNumber: true })}
                    />
                    <FieldError msg={form.formState.errors.roundingPrecision?.message} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pk-proration">Proration basis</Label>
                  <Controller
                    control={form.control}
                    name="prorationBasis"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="pk-proration" className="w-full cursor-pointer">
                          <SelectValue>
                            {(v) =>
                              PRORATION_LABEL[v as StatutoryPackEditorValues['prorationBasis']] ?? v
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            Object.keys(PRORATION_LABEL) as Array<keyof typeof PRORATION_LABEL>
                          ).map((b) => (
                            <SelectItem key={b} value={b}>
                              {PRORATION_LABEL[b]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </TabsContent>

              {/* Tax regimes */}
              <TabsContent value="regimes" className="mt-0 space-y-3">
                {typeof form.formState.errors.taxRegimes?.message === 'string' && (
                  <p className="text-xs text-danger">{form.formState.errors.taxRegimes.message}</p>
                )}
                {regimes.fields.map((f, i) => (
                  <RegimeCard key={f.id} form={form} index={i} onRemove={() => regimes.remove(i)} />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    regimes.append({
                      code: '',
                      fiscalYear: '',
                      currency: form.getValues('currency') || 'INR',
                      standardDeduction: 0,
                      cessRate: null,
                      slabs: [{ from: 0, to: null, rate: 0 }],
                      surcharges: [],
                      allowedExemptions: [],
                    })
                  }
                >
                  <PlusIcon className="size-3.5" aria-hidden />
                  Add tax regime
                </Button>
              </TabsContent>

              {/* Contribution schemes */}
              <TabsContent value="contributions" className="mt-0 space-y-3">
                {schemes.fields.length === 0 && (
                  <p className="text-sm text-fg-muted">
                    No contribution schemes. Add PF / ESI / FICA-style schemes below.
                  </p>
                )}
                {schemes.fields.map((f, i) => {
                  const err = form.formState.errors.contributionSchemes?.[i];
                  return (
                    <div key={f.id} className="rounded-lg border border-subtle">
                      <div className="flex items-center justify-between gap-2 border-b border-subtle px-3 py-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                          Scheme {i + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-fg-muted hover:text-danger"
                          onClick={() => schemes.remove(i)}
                          aria-label={`Remove scheme ${i + 1}`}
                        >
                          <Trash2Icon className="size-3.5" aria-hidden />
                        </Button>
                      </div>
                      <div className="space-y-4 px-3 py-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Code</Label>
                            <Input
                              {...form.register(`contributionSchemes.${i}.code`)}
                              placeholder="IN_EPF"
                              className="font-mono"
                            />
                            <FieldError msg={err?.code?.message} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Name</Label>
                            <Input
                              {...form.register(`contributionSchemes.${i}.name`)}
                              placeholder="Provident Fund"
                            />
                            <FieldError msg={err?.name?.message} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Wage base tag</Label>
                            <Input
                              {...form.register(`contributionSchemes.${i}.wageBaseTag`, {
                                setValueAs: (v: string) => (v ? v.toUpperCase() : ''),
                              })}
                              placeholder="PF_WAGE"
                              className="font-mono uppercase"
                            />
                            <FieldError msg={err?.wageBaseTag?.message} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Wage ceiling (blank = uncapped)</Label>
                            <Controller
                              control={form.control}
                              name={`contributionSchemes.${i}.wageCeiling`}
                              render={({ field, fieldState }) => (
                                <NumberCell
                                  value={field.value}
                                  onChange={field.onChange}
                                  nullable
                                  placeholder="15000"
                                  error={fieldState.error?.message}
                                />
                              )}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Apportionment (sub-monthly)</Label>
                            <Controller
                              control={form.control}
                              name={`contributionSchemes.${i}.apportionmentMode`}
                              render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger className="w-full cursor-pointer">
                                    <SelectValue>
                                      {(v) =>
                                        v === 'PER_CYCLE'
                                          ? 'Per cycle'
                                          : 'Monthly total (shared across cycles)'
                                      }
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="MONTHLY_TOTAL">
                                      Monthly total (shared across cycles)
                                    </SelectItem>
                                    <SelectItem value="PER_CYCLE">Per cycle</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                            <p className="text-[11px] text-fg-muted">
                              How a monthly cap (e.g. SSS) splits across semi-monthly / bi-weekly
                              cycles.
                            </p>
                          </div>
                          <div className="space-y-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Employee rate %</Label>
                            <Controller
                              control={form.control}
                              name={`contributionSchemes.${i}.employeeRate`}
                              render={({ field, fieldState }) => (
                                <NumberCell
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="12"
                                  error={fieldState.error?.message}
                                />
                              )}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Employee posts to</Label>
                            <Input
                              {...form.register(`contributionSchemes.${i}.employeeComponent`, {
                                setValueAs: (v: string) => (v ? v.toUpperCase() : ''),
                              })}
                              placeholder="PF"
                              className="font-mono uppercase"
                            />
                            <FieldError msg={err?.employeeComponent?.message} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Employer rate %</Label>
                            <Controller
                              control={form.control}
                              name={`contributionSchemes.${i}.employerRate`}
                              render={({ field, fieldState }) => (
                                <NumberCell
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="12"
                                  error={fieldState.error?.message}
                                />
                              )}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Employer posts to</Label>
                            <Input
                              {...form.register(`contributionSchemes.${i}.employerComponent`, {
                                setValueAs: (v: string) => (v ? v.toUpperCase() : ''),
                              })}
                              placeholder="PF_ER"
                              className="font-mono uppercase"
                            />
                            <FieldError msg={err?.employerComponent?.message} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">
                              Applicability rule <span className="text-fg-muted">(optional)</span>
                            </Label>
                            <Input
                              {...form.register(`contributionSchemes.${i}.applicability`)}
                              placeholder="GROSS_BELOW_CEILING"
                              className="font-mono"
                            />
                            <FieldError msg={err?.applicability?.message} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">
                              Employer split{' '}
                              <span className="text-fg-muted">(KEY=%, optional)</span>
                            </Label>
                            <Textarea
                              key={f.id}
                              defaultValue={serializeSplit(
                                form.getValues(`contributionSchemes.${i}.employerSplit`) ?? {},
                              )}
                              onChange={(e) =>
                                form.setValue(
                                  `contributionSchemes.${i}.employerSplit`,
                                  parseSplit(e.target.value),
                                )
                              }
                              rows={2}
                              placeholder={'EPS=8.33\nEPF=3.67'}
                              className="resize-none font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    schemes.append({
                      code: '',
                      name: '',
                      wageBaseTag: '',
                      wageCeiling: null,
                      apportionmentMode: 'MONTHLY_TOTAL',
                      applicability: '',
                      employeeRate: 0,
                      employeeComponent: '',
                      employerRate: 0,
                      employerComponent: '',
                      employerSplit: {},
                    })
                  }
                >
                  <PlusIcon className="size-3.5" aria-hidden />
                  Add scheme
                </Button>
              </TabsContent>

              {/* Local taxes */}
              <TabsContent value="local" className="mt-0 space-y-3">
                {locals.fields.length === 0 && (
                  <p className="text-sm text-fg-muted">
                    No local taxes. Add professional tax / city tax bands if the country has them.
                  </p>
                )}
                {locals.fields.map((f, i) => (
                  <LocalTaxCard
                    key={f.id}
                    form={form}
                    index={i}
                    onRemove={() => locals.remove(i)}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    locals.append({
                      code: '',
                      name: '',
                      jurisdiction: '',
                      component: '',
                      slabs: [{ from: 0, to: null, amount: 0 }],
                    })
                  }
                >
                  <PlusIcon className="size-3.5" aria-hidden />
                  Add local tax
                </Button>
              </TabsContent>

              {/* Minimum wages */}
              <TabsContent value="minwage" className="mt-0 space-y-3">
                {minwages.fields.length === 0 && (
                  <p className="text-sm text-fg-muted">
                    No minimum wages. Add per-jurisdiction monthly floors (post-compute check).
                  </p>
                )}
                {minwages.fields.map((f, i) => {
                  const err = form.formState.errors.minimumWages?.[i];
                  return (
                    <div key={f.id} className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Jurisdiction</Label>
                        <Input
                          {...form.register(`minimumWages.${i}.jurisdiction`)}
                          placeholder="IN-MH"
                          className="font-mono"
                        />
                        <FieldError msg={err?.jurisdiction?.message} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Monthly floor</Label>
                        <Controller
                          control={form.control}
                          name={`minimumWages.${i}.monthlyFloor`}
                          render={({ field, fieldState }) => (
                            <NumberCell
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="15000"
                              error={fieldState.error?.message}
                            />
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-9 shrink-0 text-fg-muted hover:text-danger"
                        onClick={() => minwages.remove(i)}
                        aria-label={`Remove minimum wage ${i + 1}`}
                      >
                        <Trash2Icon className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => minwages.append({ jurisdiction: '', monthlyFloor: 0 })}
                >
                  <PlusIcon className="size-3.5" aria-hidden />
                  Add minimum wage
                </Button>
              </TabsContent>

              {/* Statutory components */}
              <TabsContent value="components" className="mt-0 space-y-3">
                <p className="text-sm text-fg-muted">
                  Component codes this pack expects to exist for statutory postings (PF, ESI, TDS…).
                </p>
                <Controller
                  control={form.control}
                  name="statutoryComponents"
                  render={({ field }) => (
                    <TagInput value={field.value} onChange={field.onChange} placeholder="PF" />
                  )}
                />
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-subtle px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} aria-busy={isPending}>
              {isPending && <Loader2Icon className="size-3.5 animate-spin" aria-hidden />}
              {isEdit ? 'Save Changes' : 'Create Pack'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
