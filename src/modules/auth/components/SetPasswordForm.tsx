'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ApiError } from '@/types/api';
import { cn } from '@/lib/utils';

import { setPasswordSchema, type SetPasswordInput } from '../validations/set-password.schema';
import { useInvitation } from '../hooks/useInvitation';
import { useAcceptInvitation } from '../hooks/useAcceptInvitation';
import { useResendInvitation } from '../hooks/useResendInvitation';
import type { InvitationStatus } from '../types/auth.types';

/* ── Self-serve "request a new link" (no-leak) ───────────────────────────── */

function RequestNewLink() {
  const { mutateAsync, isPending } = useResendInvitation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setError(null);
    try {
      await mutateAsync(email);
      setSent(true);
    } catch (err) {
      const status = (err as AxiosError<ApiError>).response?.status;
      setError(
        status === 429
          ? 'Too many requests. Please try again in a few minutes.'
          : 'Something went wrong. Please try again.',
      );
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="flex items-start gap-2.5 rounded-lg border border-subtle bg-surface-2/50 px-4 py-3 text-sm text-fg-muted"
      >
        <MailCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
        If an invite exists for that email, a new link is on its way. Check your inbox.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2" noValidate>
      <Label htmlFor="resend-email" className="text-sm font-medium text-fg">
        Request a new link
      </Label>
      <div className="flex gap-2">
        <Input
          id="resend-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          disabled={isPending}
          autoComplete="email"
        />
        <Button type="submit" variant="outline" disabled={isPending || !email}>
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : 'Send'}
        </Button>
      </div>
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

/* ── Invalid-invitation view (expired / used / not-found / no token) ─────── */

const INVALID_COPY: Record<Exclude<InvitationStatus, 'VALID'>, { title: string; body: string }> = {
  EXPIRED: {
    title: 'This invitation has expired',
    body: 'Invitation links are valid for a limited time. Request a new one below or ask your administrator to resend it.',
  },
  USED: {
    title: 'This invitation was already used',
    body: 'If you have already set your password, just sign in. Otherwise request a new link below.',
  },
  NOT_FOUND: {
    title: 'This invitation link is invalid',
    body: 'The link may be broken or incomplete. Request a new one below or contact your administrator.',
  },
};

function InvalidInvitation({ status }: { status: Exclude<InvitationStatus, 'VALID'> }) {
  const copy = INVALID_COPY[status];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">{copy.title}</h1>
        <p className="mt-1 text-sm text-fg-muted">{copy.body}</p>
      </div>

      <RequestNewLink />

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden />
        Back to sign in
      </Link>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */

export function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { data, isLoading, isError, refetch } = useInvitation(token);
  const { mutateAsync, isPending } = useAcceptInvitation();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitInvalid, setSubmitInvalid] = useState<Exclude<InvitationStatus, 'VALID'> | null>(
    null,
  );

  const form = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  // No token in the URL → treat as an invalid link.
  if (!token) return <InvalidInvitation status="NOT_FOUND" />;

  // Validating the token.
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center" role="status">
        <Loader2 className="size-6 animate-spin text-fg-muted" aria-hidden />
        <p className="text-sm text-fg-muted">Validating your invitation…</p>
      </div>
    );
  }

  // Network/server failure while validating (the endpoint itself always 200s).
  if (isError || !data) {
    return (
      <div className="space-y-6">
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          We couldn’t validate your invitation. Please check your connection and try again.
        </div>
        <Button variant="outline" className="w-full" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const effectiveStatus = submitInvalid ?? (data.status === 'VALID' ? null : data.status);
  if (effectiveStatus) return <InvalidInvitation status={effectiveStatus} />;

  async function onSubmit(values: SetPasswordInput) {
    setGeneralError(null);
    try {
      await mutateAsync({ token, password: values.password });
      router.push('/login?activated=success');
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const status = axiosErr.response?.status;
      const code = axiosErr.response?.data?.error?.code;
      if (status === 410 || code === 'INVITE_EXPIRED') {
        setSubmitInvalid('EXPIRED');
      } else if (status === 409 || code === 'INVITE_ALREADY_USED') {
        setSubmitInvalid('USED');
      } else if (status === 404 || code === 'INVALID_TOKEN') {
        setSubmitInvalid('NOT_FOUND');
      } else if (status === 422) {
        const details = axiosErr.response?.data?.error?.details;
        if (Array.isArray(details) && details.length > 0) {
          details.forEach((d) => form.setError('password', { message: d.message }));
        } else {
          form.setError('password', { message: 'Password does not meet the requirements.' });
        }
      } else if (!axiosErr.response) {
        setGeneralError('Unable to connect to the server. Check your connection and try again.');
      } else {
        setGeneralError('Something went wrong. Please try again.');
      }
    }
  }

  const firstName = data.employee?.firstName;
  const companyName = data.employee?.companyName;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">
          {firstName ? `Welcome, ${firstName}` : 'Set your password'}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {companyName
            ? `Choose a password to activate your account at ${companyName}.`
            : 'Choose a strong password to activate your account.'}
        </p>
      </div>

      {generalError && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {generalError}
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-fg">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              disabled={isPending}
              aria-invalid={!!form.formState.errors.password}
              aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
              className={cn(
                'pr-10',
                form.formState.errors.password && 'border-danger focus-visible:ring-danger/30',
              )}
              {...form.register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-fg-muted transition-colors hover:text-fg"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {form.formState.errors.password ? (
            <p id="password-error" className="text-xs text-danger" role="alert">
              {form.formState.errors.password.message}
            </p>
          ) : (
            <p className="text-xs text-fg-muted">
              At least 8 characters, with an uppercase, a lowercase, and a number.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-fg">
            Confirm password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              disabled={isPending}
              aria-invalid={!!form.formState.errors.confirmPassword}
              aria-describedby={form.formState.errors.confirmPassword ? 'confirm-error' : undefined}
              className={cn(
                'pr-10',
                form.formState.errors.confirmPassword &&
                  'border-danger focus-visible:ring-danger/30',
              )}
              {...form.register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-fg-muted transition-colors hover:text-fg"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showConfirm ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
          {form.formState.errors.confirmPassword && (
            <p id="confirm-error" className="text-xs text-danger" role="alert">
              {form.formState.errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Activating…
            </>
          ) : (
            'Activate account'
          )}
        </Button>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden />
        Back to sign in
      </Link>
    </div>
  );
}
