'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import { useCountries, useCreateLegalEntity, useUpdateLegalEntity } from '../hooks/useLocalization';
import { legalEntitySchema } from '../validations/legal-entity.schema';
import type { LegalEntityFormValues } from '../validations/legal-entity.schema';
import type { LegalEntity } from '../types/localization.types';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function parseRegistrationIds(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  text.split('\n').forEach((line) => {
    const i = line.indexOf('=');
    if (i > 0) {
      const key = line.slice(0, i).trim();
      const value = line.slice(i + 1).trim();
      if (key) out[key] = value;
    }
  });
  return out;
}

function serializeRegistrationIds(record: Record<string, string>): string {
  return Object.entries(record)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

interface LegalEntityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity?: LegalEntity | null;
}

export function LegalEntityDrawer({ open, onOpenChange, entity }: LegalEntityDrawerProps) {
  const isEdit = !!entity;
  const { data: countries = [] } = useCountries();
  const createMutation = useCreateLegalEntity();
  const updateMutation = useUpdateLegalEntity();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<LegalEntityFormValues>({
    resolver: zodResolver(legalEntitySchema),
    defaultValues: {
      name: '',
      country: '',
      currency: '',
      fiscalYearStartMonth: 1,
      workWeekPattern: 'MON-FRI',
      timezone: '',
      locale: '',
      registrationIds: {},
      active: true,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (entity) {
      form.reset({
        name: entity.name,
        country: entity.country,
        currency: entity.currency,
        fiscalYearStartMonth: entity.fiscalYearStartMonth,
        workWeekPattern: entity.workWeekPattern,
        timezone: entity.timezone,
        locale: entity.locale,
        registrationIds: entity.registrationIds,
        active: entity.active,
      });
    } else {
      form.reset({
        name: '',
        country: '',
        currency: '',
        fiscalYearStartMonth: 1,
        timezone: '',
        locale: '',
        registrationIds: {},
        active: true,
      });
    }
  }, [open, entity]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCountryChange(code: string) {
    form.setValue('country', code);
    const country = countries.find((c) => c.code === code);
    if (country) {
      // Auto-fill sensible defaults; the user can still override.
      form.setValue('currency', country.currency);
      form.setValue('locale', country.locale);
      form.setValue('fiscalYearStartMonth', country.fiscalYearStartMonth);
    }
  }

  function handleRegTextChange(text: string) {
    form.setValue('registrationIds', parseRegistrationIds(text), { shouldValidate: false });
  }

  function onSubmit(values: LegalEntityFormValues) {
    const onError = (err: unknown) => {
      const apiErr = (err as AxiosError<{ error: { message: string } }>).response?.data?.error;
      toast.error(apiErr?.message ?? 'Failed to save legal entity');
    };

    if (isEdit && entity) {
      updateMutation.mutate(
        { id: entity.id, ...values },
        {
          onSuccess: () => {
            toast.success('Legal entity updated');
            onOpenChange(false);
          },
          onError,
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success('Legal entity created');
          onOpenChange(false);
        },
        onError,
      });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={!isPending}
        className="flex w-full flex-col gap-0 p-0 sm:w-[520px] sm:max-w-[520px]"
      >
        <SheetHeader className="shrink-0 border-b border-subtle px-6 py-4">
          <SheetTitle>{isEdit ? 'Edit Legal Entity' : 'New Legal Entity'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="le-name">Entity name</Label>
              <Input id="le-name" {...form.register('name')} placeholder="Acme India Pvt Ltd" />
              {form.formState.errors.name && (
                <p className="text-xs text-danger">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Country */}
              <div className="space-y-1.5">
                <Label htmlFor="le-country">Country</Label>
                <Controller
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={(v) => handleCountryChange(v ?? '')}
                    >
                      <SelectTrigger id="le-country" className="w-full cursor-pointer">
                        <SelectValue placeholder="Select country">
                          {(v) => countries.find((c) => c.code === v)?.name ?? 'Select country'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.name} ({c.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.country && (
                  <p className="text-xs text-danger">{form.formState.errors.country.message}</p>
                )}
              </div>

              {/* Currency */}
              <div className="space-y-1.5">
                <Label htmlFor="le-currency">Currency</Label>
                <Input
                  id="le-currency"
                  {...form.register('currency')}
                  placeholder="INR"
                  className="font-mono uppercase"
                />
                {form.formState.errors.currency && (
                  <p className="text-xs text-danger">{form.formState.errors.currency.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Fiscal year start month */}
              <div className="space-y-1.5">
                <Label htmlFor="le-fy">Fiscal year starts</Label>
                <Controller
                  control={form.control}
                  name="fiscalYearStartMonth"
                  render={({ field }) => (
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger id="le-fy" className="w-full cursor-pointer">
                        <SelectValue>{(v) => MONTHS[Number(v) - 1] ?? v}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m, i) => (
                          <SelectItem key={m} value={String(i + 1)}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {/* Locale */}
              <div className="space-y-1.5">
                <Label htmlFor="le-locale">Locale</Label>
                <Input id="le-locale" {...form.register('locale')} placeholder="en-IN" />
                {form.formState.errors.locale && (
                  <p className="text-xs text-danger">{form.formState.errors.locale.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Timezone */}
              <div className="space-y-1.5">
                <Label htmlFor="le-tz">Timezone</Label>
                <Input id="le-tz" {...form.register('timezone')} placeholder="Asia/Kolkata" />
                {form.formState.errors.timezone && (
                  <p className="text-xs text-danger">{form.formState.errors.timezone.message}</p>
                )}
              </div>

              {/* Work week — proration denominator */}
              <div className="space-y-1.5">
                <Label htmlFor="le-workweek">Work week</Label>
                <Controller
                  control={form.control}
                  name="workWeekPattern"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="le-workweek" className="w-full cursor-pointer">
                        <SelectValue>
                          {(v) => (v === 'MON-SAT' ? 'Mon–Sat (6-day)' : 'Mon–Fri (5-day)')}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MON-FRI">Mon–Fri (5-day)</SelectItem>
                        <SelectItem value="MON-SAT">Mon–Sat (6-day)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {/* Registration IDs */}
            <div className="space-y-1.5">
              <Label htmlFor="le-reg">
                Registration IDs <span className="font-normal text-fg-muted">(optional)</span>
              </Label>
              <Textarea
                id="le-reg"
                key={entity?.id ?? 'new'}
                defaultValue={entity ? serializeRegistrationIds(entity.registrationIds) : ''}
                onChange={(e) => handleRegTextChange(e.target.value)}
                placeholder={'PF=MHBAN1234567\nPAN=AAAAA1234A'}
                rows={3}
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-fg-muted">One per line, as KEY=value.</p>
            </div>

            {/* Active */}
            <div className="flex items-center justify-between rounded-lg border border-subtle px-3 py-2.5">
              <Label htmlFor="le-active" className="cursor-pointer text-sm">
                Active
              </Label>
              <Controller
                control={form.control}
                name="active"
                render={({ field }) => (
                  <Switch id="le-active" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </div>

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
              {isEdit ? 'Save Changes' : 'Create Entity'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
