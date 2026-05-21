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
import { loginSchema, type LoginInput } from '../validations/login.schema';
import { useLogin } from '../hooks/useLogin';

interface LoginFormProps {
  next: string;
}

export function LoginForm({ next }: LoginFormProps) {
  const router = useRouter();
  const { mutateAsync, isPending } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginInput) {
    setGeneralError(null);
    try {
      await mutateAsync(values);
      router.push(next);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const status = axiosErr.response?.status;
      const details = axiosErr.response?.data?.error?.details;

      if (status === 422 && details?.length) {
        details.forEach(({ field, message }) => {
          form.setError(field as keyof LoginInput, { message });
        });
      } else if (status === 401 || status === 400) {
        setGeneralError('Invalid email or password. Please try again.');
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
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Sign in</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Enter your work email and password to continue.
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-sm font-medium text-fg">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-brand hover:text-brand-hover transition-colors"
              tabIndex={isPending ? -1 : 0}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
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
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
    </div>
  );
}
