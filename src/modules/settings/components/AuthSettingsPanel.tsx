'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldIcon, SaveIcon, LockIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { RoleGate } from '@/shared/guards/RoleGate';
import type { ApiError } from '@/types/api';

import { useAuthSettings } from '../hooks/useSettings';
import { useUpdateAuthSettings } from '../hooks/useSettingsMutations';
import { authSettingsSchema, type AuthSettingsFormValues } from '../validations/settings.schema';

const MFA_OPTIONS = [
  { value: 'OPTIONAL', label: 'Optional — users choose' },
  { value: 'REQUIRED_ADMINS', label: 'Required for admins' },
  { value: 'REQUIRED_ALL', label: 'Required for everyone' },
] as const;

function AuthSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-subtle px-4 py-3 flex items-center justify-between"
          >
            <div className="space-y-1">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
            <Skeleton className="h-6 w-10 rounded-full" />
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthSettingsPanel() {
  const { data, isLoading, isError, refetch } = useAuthSettings();
  const mutation = useUpdateAuthSettings();

  const form = useForm<AuthSettingsFormValues>({
    resolver: zodResolver(authSettingsSchema),
    defaultValues: {
      password_min_length: 12,
      password_require_symbol: true,
      password_require_number: true,
      session_idle_timeout_minutes: 60,
      mfa_policy: 'OPTIONAL',
      sso_enabled: false,
    },
  });

  useEffect(() => {
    if (data) {
      form.reset({
        password_min_length: data.password_min_length,
        password_require_symbol: data.password_require_symbol,
        password_require_number: data.password_require_number,
        session_idle_timeout_minutes: data.session_idle_timeout_minutes,
        mfa_policy: data.mfa_policy,
        sso_enabled: data.sso_enabled,
      });
    }
  }, [data, form]);

  function onSubmit(values: AuthSettingsFormValues) {
    mutation.mutate(values, {
      onSuccess: () => toast.success('Authentication settings saved'),
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiError>;
        toast.error(
          axiosErr.response?.data?.error?.message ?? 'Failed to save authentication settings',
        );
      },
    });
  }

  if (isError) {
    return (
      <ErrorState
        message="Failed to load authentication settings."
        onRetry={() => void refetch()}
      />
    );
  }

  if (isLoading) return <AuthSettingsSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldIcon className="size-4 text-fg-subtle" />
          <h2 className="text-sm font-semibold text-fg">Authentication</h2>
        </div>
        <p className="text-sm text-fg-muted">
          Manage password policy, session timeouts, and multi-factor authentication for the
          organisation.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Password policy */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-fg-disabled">
            Password Policy
          </p>

          {/* Min length */}
          <div className="space-y-1.5">
            <Label htmlFor="password_min_length">Minimum Length</Label>
            <div className="flex items-center gap-2">
              <Input
                id="password_min_length"
                type="number"
                min={8}
                max={128}
                className="max-w-[100px]"
                {...form.register('password_min_length', { valueAsNumber: true })}
              />
              <span className="text-sm text-fg-muted">characters</span>
            </div>
            {form.formState.errors.password_min_length && (
              <p className="text-xs text-danger">
                {form.formState.errors.password_min_length.message}
              </p>
            )}
          </div>

          {/* Require symbol */}
          <div className="rounded-lg border border-subtle px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-fg">Require symbol</p>
              <p className="text-xs text-fg-muted mt-0.5">
                Passwords must include at least one symbol (e.g. !@#$).
              </p>
            </div>
            <Switch
              checked={form.watch('password_require_symbol')}
              onCheckedChange={(val) =>
                form.setValue('password_require_symbol', val, { shouldDirty: true })
              }
            />
          </div>

          {/* Require number */}
          <div className="rounded-lg border border-subtle px-4 py-3 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-fg">Require number</p>
              <p className="text-xs text-fg-muted mt-0.5">
                Passwords must include at least one numeric digit.
              </p>
            </div>
            <Switch
              checked={form.watch('password_require_number')}
              onCheckedChange={(val) =>
                form.setValue('password_require_number', val, { shouldDirty: true })
              }
            />
          </div>
        </section>

        {/* Sessions */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-fg-disabled">
            Sessions
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="session_idle_timeout_minutes">Idle Timeout</Label>
            <div className="flex items-center gap-2">
              <Input
                id="session_idle_timeout_minutes"
                type="number"
                min={5}
                max={10080}
                className="max-w-[100px]"
                {...form.register('session_idle_timeout_minutes', { valueAsNumber: true })}
              />
              <span className="text-sm text-fg-muted">minutes</span>
            </div>
            {form.formState.errors.session_idle_timeout_minutes && (
              <p className="text-xs text-danger">
                {form.formState.errors.session_idle_timeout_minutes.message}
              </p>
            )}
          </div>
        </section>

        {/* MFA */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-fg-disabled">
            Multi-factor Authentication
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="mfa_policy">MFA Policy</Label>
            <Controller
              control={form.control}
              name="mfa_policy"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="mfa_policy" className="max-w-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MFA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.mfa_policy && (
              <p className="text-xs text-danger">{form.formState.errors.mfa_policy.message}</p>
            )}
          </div>
        </section>

        {/* SSO — Phase 2 */}
        <section className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-fg-disabled">
            Single Sign-On
          </p>

          <div className="rounded-lg border border-subtle px-4 py-3 flex items-center justify-between gap-4 opacity-60">
            <div>
              <div className="flex items-center gap-2">
                <LockIcon className="size-3.5 text-fg-muted" />
                <p className="text-sm font-medium text-fg">SSO / SAML</p>
                <span className="text-[0.6rem] font-semibold px-1 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 leading-none">
                  Phase 2
                </span>
              </div>
              <p className="text-xs text-fg-muted mt-0.5">
                Enable SAML-based single sign-on for your identity provider.
              </p>
            </div>
            <Switch
              checked={form.watch('sso_enabled')}
              onCheckedChange={(val) => form.setValue('sso_enabled', val, { shouldDirty: true })}
              disabled
            />
          </div>
        </section>

        {/* Actions */}
        <RoleGate roles={['SUPER_ADMIN']}>
          {form.formState.isDirty && (
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={mutation.isPending}>
                <SaveIcon className="size-3.5 mr-1.5" />
                {mutation.isPending ? 'Saving…' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  form.reset({
                    password_min_length: data?.password_min_length ?? 12,
                    password_require_symbol: data?.password_require_symbol ?? true,
                    password_require_number: data?.password_require_number ?? true,
                    session_idle_timeout_minutes: data?.session_idle_timeout_minutes ?? 60,
                    mfa_policy: data?.mfa_policy ?? 'OPTIONAL',
                    sso_enabled: data?.sso_enabled ?? false,
                  })
                }
                disabled={mutation.isPending}
              >
                Discard
              </Button>
            </div>
          )}
        </RoleGate>
      </form>
    </div>
  );
}
