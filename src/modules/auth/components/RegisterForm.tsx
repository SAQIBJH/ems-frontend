// src/modules/auth/components/RegisterForm.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import type { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ApiError } from '@/types/api';
import { cn } from '@/lib/utils';
import { registerSchema, type RegisterInput } from '../validations/register.schema';
import { useRegister } from '../hooks/useRegister';

export function RegisterForm() {
  const { push } = useRouter();
  const { mutateAsync, isPending } = useRegister();
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { companyName: '', fullName: '', email: '', password: '' },
  });

  async function onSubmit(values: RegisterInput) {
    setGeneralError(null);
    try {
      await mutateAsync(values);
      // Cookies set by the server — go straight to the dashboard.
      push('/dashboard');
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const status = axiosErr.response?.status;
      const details = axiosErr.response?.data?.error?.details;

      if (status === 422 && details?.length) {
        details.forEach(({ field, message }) => {
          form.setError(field as keyof RegisterInput, { message });
        });
      } else if (status === 409) {
        form.setError('email', { message: 'This email is already registered. Try signing in.' });
      } else if (!axiosErr.response) {
        setGeneralError('Unable to connect to the server. Check your connection and try again.');
      } else {
        setGeneralError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">
          Create your company workspace
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Set up your company and admin account. You can add the rest later.
        </p>
      </div>

      {/* General error */}
      {generalError && (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          {generalError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Company name */}
        <div className="space-y-1.5">
          <Label htmlFor="companyName" className="text-sm font-medium text-fg">
            Company name
          </Label>
          <Input
            id="companyName"
            type="text"
            autoComplete="organization"
            placeholder="Acme Inc"
            disabled={isPending}
            aria-invalid={!!form.formState.errors.companyName}
            aria-describedby={form.formState.errors.companyName ? 'companyName-error' : undefined}
            className={cn(
              form.formState.errors.companyName && 'border-danger focus-visible:ring-danger/30',
            )}
            {...form.register('companyName')}
          />
          {form.formState.errors.companyName && (
            <p id="companyName-error" className="text-xs text-danger" role="alert">
              {form.formState.errors.companyName.message}
            </p>
          )}
        </div>

        {/* Full name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-sm font-medium text-fg">
            Your name
          </Label>
          <Input
            id="fullName"
            type="text"
            autoComplete="name"
            placeholder="Jane Doe"
            disabled={isPending}
            aria-invalid={!!form.formState.errors.fullName}
            aria-describedby={form.formState.errors.fullName ? 'fullName-error' : undefined}
            className={cn(
              form.formState.errors.fullName && 'border-danger focus-visible:ring-danger/30',
            )}
            {...form.register('fullName')}
          />
          {form.formState.errors.fullName && (
            <p id="fullName-error" className="text-xs text-danger" role="alert">
              {form.formState.errors.fullName.message}
            </p>
          )}
        </div>

        {/* Email */}
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

        {/* Password */}
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

        {/* Submit */}
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Creating workspace…
            </>
          ) : (
            'Create workspace'
          )}
        </Button>
      </form>

      {/* Footer link */}
      <p className="text-center text-sm text-fg-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-brand hover:text-brand-hover transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
