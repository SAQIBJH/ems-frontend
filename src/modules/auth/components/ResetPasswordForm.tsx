'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ApiError } from '@/types/api';
import { cn } from '@/lib/utils';
import { resetPasswordSchema, type ResetPasswordInput } from '../validations/reset-password.schema';
import { useResetPassword } from '../hooks/useResetPassword';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const { mutateAsync, isPending } = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!token) {
    return (
      <div className="space-y-6">
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          Invalid or missing reset token. Please request a new password reset link.
        </div>
        <Link
          href="/forgot-password"
          className="flex items-center gap-1.5 text-sm text-brand hover:text-brand-hover transition-colors"
        >
          <ArrowLeftIcon className="size-3.5" aria-hidden />
          Request a new link
        </Link>
      </div>
    );
  }

  async function onSubmit(values: ResetPasswordInput) {
    setGeneralError(null);
    try {
      await mutateAsync({ token, password: values.password });
      router.push('/login?reset=success');
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const status = axiosErr.response?.status;
      if (status === 400 || status === 401) {
        setGeneralError('This reset link has expired or is invalid. Please request a new one.');
      } else if (!axiosErr.response) {
        setGeneralError('Unable to connect to the server. Check your connection and try again.');
      } else {
        setGeneralError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Set new password</h1>
        <p className="mt-1 text-sm text-fg-muted">Choose a strong password for your account.</p>
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
            New password
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
              className="absolute inset-y-0 right-0 flex items-center px-3 text-fg-muted hover:text-fg transition-colors"
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
          {form.formState.errors.password && (
            <p id="password-error" className="text-xs text-danger" role="alert">
              {form.formState.errors.password.message}
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
              className="absolute inset-y-0 right-0 flex items-center px-3 text-fg-muted hover:text-fg transition-colors"
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
              Saving…
            </>
          ) : (
            'Set new password'
          )}
        </Button>
      </form>

      <Link
        href="/login"
        className="flex items-center justify-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors"
      >
        <ArrowLeftIcon className="size-3.5" aria-hidden />
        Back to sign in
      </Link>
    </div>
  );
}
