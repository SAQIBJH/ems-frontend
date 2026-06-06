'use client';

import { useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, SaveIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorState } from '@/components/feedback/ErrorState';
import { cn } from '@/lib/utils';

import {
  usePayslipTemplate,
  useUpdatePayslipTemplate,
  useEventCatalogue,
  PAYROLL_EVENT_CATALOGUE,
  PAYROLL_EVENT_CONFIG,
} from '@/modules/payroll';
import type {
  PayslipTemplate,
  PayslipTemplateSection,
  PayslipTemplateField,
} from '@/modules/payroll';
import { FormRow, PanelHeader } from '@/modules/settings/components/FormRow';

const LOCALE_OPTIONS = [
  { value: 'en-IN', label: 'English (India)' },
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'de-DE', label: 'German (Germany)' },
  { value: 'fr-FR', label: 'French (France)' },
  { value: 'ar-AE', label: 'Arabic (UAE)' },
];

export function PayslipTemplatePanel() {
  const { data, isLoading, isError, refetch } = usePayslipTemplate();
  const { data: catalogue } = useEventCatalogue();
  const mutation = useUpdatePayslipTemplate();

  const [draft, setDraft] = useState<PayslipTemplate | null>(null);
  // Sync the editable draft from server data during render (no effect needed) — resets
  // whenever a fresh template arrives. See "You Might Not Need an Effect".
  const [syncedFrom, setSyncedFrom] = useState<PayslipTemplate | undefined>(undefined);
  if (data && data !== syncedFrom) {
    setSyncedFrom(data);
    setDraft(structuredClone(data));
  }

  if (isLoading || !draft) {
    return <PayslipTemplateSkeleton />;
  }
  if (isError) {
    return <ErrorState message="Failed to load payslip template" onRetry={() => refetch()} />;
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(data);

  function patch(updates: Partial<PayslipTemplate>) {
    setDraft((d) => (d ? { ...d, ...updates } : d));
  }

  function updateSection(key: string, updates: Partial<PayslipTemplateSection>) {
    setDraft((d) =>
      d ? { ...d, sections: d.sections.map((s) => (s.key === key ? { ...s, ...updates } : s)) } : d,
    );
  }

  function moveSection(key: string, dir: -1 | 1) {
    setDraft((d) => {
      if (!d) return d;
      const ordered = [...d.sections].sort((a, b) => a.order - b.order);
      const idx = ordered.findIndex((s) => s.key === key);
      const swapWith = idx + dir;
      if (swapWith < 0 || swapWith >= ordered.length) return d;
      const a = ordered[idx];
      const b = ordered[swapWith];
      const sections = d.sections.map((s) => {
        if (s.key === a.key) return { ...s, order: b.order };
        if (s.key === b.key) return { ...s, order: a.order };
        return s;
      });
      return { ...d, sections };
    });
  }

  function updateField(key: string, updates: Partial<PayslipTemplateField>) {
    setDraft((d) =>
      d ? { ...d, fields: d.fields.map((f) => (f.key === key ? { ...f, ...updates } : f)) } : d,
    );
  }

  async function handleSave() {
    if (!draft) return;
    try {
      await mutation.mutateAsync({
        name: draft.name,
        locale: draft.locale,
        logoUrl: draft.logoUrl,
        sections: draft.sections,
        fields: draft.fields,
      });
      toast.success('Payslip template saved.');
    } catch (err) {
      const apiErr = (err as AxiosError<{ error: { message: string } }>).response?.data?.error;
      toast.error(apiErr?.message ?? 'Failed to save template');
    }
  }

  const orderedSections = [...draft.sections].sort((a, b) => a.order - b.order);
  const events = catalogue ?? PAYROLL_EVENT_CATALOGUE;

  return (
    <div className="space-y-8">
      <div className="divide-y divide-subtle">
        <PanelHeader
          section="Pay & Compliance"
          title="Payslip Template"
          description="The payslip layout is configuration — choose sections, order, header fields, logo, and language. One template applies to every country."
        />

        <FormRow label="Template name">
          <Input value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
        </FormRow>

        <FormRow label="Language" help="Locale used for the slip's language and number formatting.">
          <Select value={draft.locale} onValueChange={(v) => v && patch({ locale: v })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOCALE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormRow>

        <FormRow label="Logo URL" help="Shown at the top of the payslip. Leave blank for none.">
          <Input
            value={draft.logoUrl ?? ''}
            placeholder="https://…"
            onChange={(e) => patch({ logoUrl: e.target.value || null })}
          />
        </FormRow>

        <FormRow label="Sections" help="Toggle, reorder, and rename the sections on the slip.">
          <ul className="space-y-2">
            {orderedSections.map((s, i) => (
              <li
                key={s.key}
                className="flex items-center gap-2 rounded-lg border border-subtle bg-surface p-2"
              >
                <div className="flex flex-col">
                  <button
                    type="button"
                    aria-label={`Move ${s.label} up`}
                    disabled={i === 0}
                    onClick={() => moveSection(s.key, -1)}
                    className="text-fg-muted hover:text-fg disabled:opacity-30"
                  >
                    <ArrowUpIcon className="size-3.5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${s.label} down`}
                    disabled={i === orderedSections.length - 1}
                    onClick={() => moveSection(s.key, 1)}
                    className="text-fg-muted hover:text-fg disabled:opacity-30"
                  >
                    <ArrowDownIcon className="size-3.5" aria-hidden />
                  </button>
                </div>
                <Input
                  value={s.label}
                  onChange={(e) => updateSection(s.key, { label: e.target.value })}
                  className="h-8 flex-1"
                />
                <Switch
                  checked={s.enabled}
                  onCheckedChange={(checked) => updateSection(s.key, { enabled: checked })}
                  aria-label={`Show ${s.label}`}
                />
              </li>
            ))}
          </ul>
        </FormRow>

        <FormRow label="Header fields" help="Employee details printed at the top of the slip.">
          <ul className="space-y-2">
            {draft.fields.map((f) => (
              <li
                key={f.key}
                className="flex items-center gap-2 rounded-lg border border-subtle bg-surface p-2"
              >
                <Input
                  value={f.label}
                  onChange={(e) => updateField(f.key, { label: e.target.value })}
                  className="h-8 flex-1"
                />
                <Switch
                  checked={f.enabled}
                  onCheckedChange={(checked) => updateField(f.key, { enabled: checked })}
                  aria-label={`Show ${f.label}`}
                />
              </li>
            ))}
          </ul>
        </FormRow>

        <div className="flex items-center gap-3 pt-6">
          <Button onClick={handleSave} disabled={!dirty || mutation.isPending}>
            <SaveIcon className="size-3.5" aria-hidden />
            {mutation.isPending ? 'Saving…' : 'Save template'}
          </Button>
          {dirty && <span className="text-xs text-fg-muted">Unsaved changes</span>}
        </div>
      </div>

      {/* Webhook event catalogue — reference for downstream integrations (§20) */}
      <div className="rounded-lg border border-subtle bg-surface">
        <div className="border-b border-subtle px-4 py-3">
          <h3 className="text-sm font-semibold text-fg">Webhook events</h3>
          <p className="text-xs text-fg-muted">
            Lifecycle events emitted for downstream systems and in-app notifications.
          </p>
        </div>
        <ul className="divide-y divide-subtle">
          {events.map((e) => (
            <li key={e.type} className="flex items-start justify-between gap-3 px-4 py-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-fg">{e.label}</span>
                  <code className="text-[11px] text-fg-muted">{e.type}</code>
                </div>
                <p className="text-xs text-fg-muted">{e.description}</p>
              </div>
              <span
                className={cn(
                  'inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-medium capitalize',
                  PAYROLL_EVENT_CONFIG[e.category].color,
                )}
              >
                {e.category}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PayslipTemplateSkeleton() {
  return (
    <div className="space-y-0 divide-y divide-subtle">
      <div className="space-y-1.5 pb-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-80" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="grid grid-cols-[200px_1fr] gap-6 py-5">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-9 w-full max-w-[480px]" />
        </div>
      ))}
    </div>
  );
}
