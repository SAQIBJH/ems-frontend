'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, Loader2, MailCheckIcon } from 'lucide-react';
import type { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ApiError } from '@/types/api';
import { cn } from '@/lib/utils';
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from '../validations/forgot-password.schema';
import { useForgotPassword } from '../hooks/useForgotPassword';

export function ForgotPasswordForm() {
  const { mutateAsync, isPending } = useForgotPassword();
  const [submitted, setSubmitted] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setGeneralError(null);
    try {
      await mutateAsync(values.email);
      setSubmitted(true);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      if (!axiosErr.response) {
        setGeneralError('Unable to connect to the server. Check your connection and try again.');
      } else {
        setGeneralError('Something went wrong. Please try again.');
      }
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-brand-100">
            <MailCheckIcon className="size-7 text-brand" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-fg">Check your email</h1>
            <p className="mt-2 text-sm text-fg-muted">
              If an account exists for{' '}
              <span className="font-medium text-fg">{form.getValues('email')}</span>, we have sent a
              password reset link.
            </p>
          </div>
          <p className="text-xs text-fg-muted">
            Didn&apos;t receive it? Check your spam folder or{' '}
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="text-brand hover:text-brand-hover underline underline-offset-2 transition-colors"
            >
              try again
            </button>
            .
          </p>
        </div>

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Forgot password?</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Enter your work email and we&apos;ll send you a reset link.
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
          <Label htmlFor="email" className="text-sm font-medium text-fg">
            Work email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            disabled={isPending}
            aria-invalid={!!form.formState.errors.email}
            aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
            className={cn(
              form.formState.errors.email && 'border-danger focus-visible:ring-danger/30',
            )}
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p id="email-error" className="text-xs text-danger" role="alert">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Sending…
            </>
          ) : (
            'Send reset link'
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
