# Company Signup (Onboarding) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public self-serve signup screen at `/(auth)/signup` that calls `POST /auth/register`, creates a new company + first SUPER_ADMIN, logs the user in via cookies, and redirects to `/dashboard`.

**Architecture:** New surface inside the existing `modules/auth` module, mirroring the login flow (schema → service → React Query mutation hook → client form → thin route). Instant login (201 sets httpOnly cookies; we invalidate the `['auth','me']` query exactly as `useLogin` does). Minimal validation only — no country/currency/timezone, no password complexity, no Terms checkbox (deferred per `docs/COMPANY_ONBOARDING_VALIDATION_ROADMAP.md`). An MSW handler serves the documented shape under `NEXT_PUBLIC_USE_MOCKS=true` until the backend ships the endpoint.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, React Hook Form + Zod, TanStack Query v5, Axios (`apiClient`), MSW, Vitest. shadcn `Input`/`Label`/`Button` (already present — no new primitives).

**Contract:** `docs/BACKEND_API_REQUESTS.md §3`. **Spec:** `docs/superpowers/specs/2026-06-11-company-onboarding-signup-design.md`.

**Test gate (project convention — `CLAUDE.md §25/§26`):** `pnpm typecheck` clean, then `pnpm lint` clean, plus `pnpm test` for the one file with pure logic (the schema). Each screen owes all four states (§13), dark mode + responsive (§15), no `any` / no raw hex (§12).

---

## File structure

| File                                                   | Create/Modify | Responsibility                                    |
| ------------------------------------------------------ | ------------- | ------------------------------------------------- |
| `src/modules/auth/validations/register.schema.ts`      | Create        | Zod schema + `RegisterInput` type (minimal rules) |
| `src/modules/auth/validations/register.schema.test.ts` | Create        | Unit tests for the schema                         |
| `src/modules/auth/types/auth.types.ts`                 | Modify        | Add `Tenant` + `RegisterResponse` types           |
| `src/modules/auth/services/auth.api.ts`                | Modify        | Add `authApi.register()`                          |
| `src/modules/auth/hooks/useRegister.ts`                | Create        | `useMutation` wrapper (mirrors `useLogin`)        |
| `src/modules/auth/components/RegisterForm.tsx`         | Create        | The client form (4 inputs, 4 states)              |
| `src/app/(auth)/signup/page.tsx`                       | Create        | Thin route (RSC) rendering `RegisterForm`         |
| `src/modules/auth/index.ts`                            | Modify        | Export `RegisterForm`, `RegisterResponse`         |
| `src/modules/auth/components/LoginForm.tsx`            | Modify        | Add "Create a company workspace" footer link      |
| `src/mocks/handlers/auth.ts`                           | Modify        | Add `POST /auth/register` + `GET /auth/me` mock   |

> The `(auth)/layout.tsx` already wraps every child in `AuthShell`, so the signup route inherits the auth chrome with **no layout change**. `src/mocks/handlers/index.ts` already spreads `authHandlers`, so adding to that array needs **no index change**.

---

## Task 1: Validation schema (TDD)

**Files:**

- Create: `src/modules/auth/validations/register.schema.ts`
- Test: `src/modules/auth/validations/register.schema.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/modules/auth/validations/register.schema.test.ts
import { describe, it, expect } from 'vitest';
import { registerSchema } from './register.schema';

describe('registerSchema', () => {
  const valid = {
    companyName: 'Acme Inc',
    fullName: 'Mohammad Saqib',
    email: 'admin@acme.com',
    password: 'secret',
  };

  it('accepts a fully filled form', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an empty company name', () => {
    const result = registerSchema.safeParse({ ...valid, companyName: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty full name', () => {
    expect(registerSchema.safeParse({ ...valid, fullName: '' }).success).toBe(false);
  });

  it('rejects a malformed email', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects an empty password', () => {
    expect(registerSchema.safeParse({ ...valid, password: '' }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/modules/auth/validations/register.schema.test.ts`
Expected: FAIL — cannot resolve `./register.schema` (module not created yet).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/modules/auth/validations/register.schema.ts
import { z } from 'zod';

// Minimal validation by design — strict rules (password strength, length limits,
// duplicate-company prevention) are deferred. See
// docs/COMPANY_ONBOARDING_VALIDATION_ROADMAP.md.
export const registerSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  fullName: z.string().min(1, 'Your name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/modules/auth/validations/register.schema.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/auth/validations/register.schema.ts src/modules/auth/validations/register.schema.test.ts
git commit -m "feat(auth): add company signup validation schema"
```

---

## Task 2: Types

**Files:**

- Modify: `src/modules/auth/types/auth.types.ts`

- [ ] **Step 1: Add the `Tenant` and `RegisterResponse` types**

Append to `src/modules/auth/types/auth.types.ts` (after `LoginResponse`):

```ts
/** Tenant block returned by POST /auth/register. country/currency/timezone are
 *  captured later in Settings → Company Profile, so they come back null at signup. */
export interface Tenant {
  id: string;
  name: string;
  country: string | null;
  currency: string | null;
  timezone: string | null;
}

/** Shape of POST /auth/register data payload — mirrors LoginResponse + the new tenant.
 *  See docs/BACKEND_API_REQUESTS.md §3. */
export interface RegisterResponse extends LoginResponse {
  tenant: Tenant;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/types/auth.types.ts
git commit -m "feat(auth): add Tenant and RegisterResponse types"
```

---

## Task 3: Service method

**Files:**

- Modify: `src/modules/auth/services/auth.api.ts`

- [ ] **Step 1: Import the new types and add `register`**

In `src/modules/auth/services/auth.api.ts`, extend the type import to include `RegisterResponse`:

```ts
import type {
  LoginResponse,
  MfaRequiredResponse,
  OtpInitiateResponse,
  RegisterResponse,
  Session,
} from '../types/auth.types';
```

And add a `register` method to the `authApi` object (place it right after `login`):

```ts
  register: async (input: {
    companyName: string;
    fullName: string;
    email: string;
    password: string;
  }): Promise<RegisterResponse> => {
    // Public endpoint — no cookies/Authorization needed. Server sets the
    // accessToken + refreshToken cookies on the 201 response.
    const { data } = await apiClient.post<{ data: RegisterResponse }>('/auth/register', input);
    return data.data;
  },
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/services/auth.api.ts
git commit -m "feat(auth): add register() service call"
```

---

## Task 4: Mutation hook

**Files:**

- Create: `src/modules/auth/hooks/useRegister.ts`

- [ ] **Step 1: Create the hook (mirrors `useLogin`)**

```ts
// src/modules/auth/hooks/useRegister.ts
import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { queryClient } from '@/lib/query-client';
import type { ApiError } from '@/types/api';
import { authApi } from '../services/auth.api';
import type { RegisterInput } from '../validations/register.schema';
import type { RegisterResponse } from '../types/auth.types';

export function useRegister() {
  return useMutation<RegisterResponse, AxiosError<ApiError>, RegisterInput>({
    mutationFn: authApi.register,
    onSuccess: () => {
      // Server has set the accessToken cookie on the 201. Invalidate the
      // /auth/me cache so AuthProvider refetches the canonical user object.
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/hooks/useRegister.ts
git commit -m "feat(auth): add useRegister mutation hook"
```

---

## Task 5: RegisterForm component

**Files:**

- Create: `src/modules/auth/components/RegisterForm.tsx`

- [ ] **Step 1: Create the form**

```tsx
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
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/components/RegisterForm.tsx
git commit -m "feat(auth): add RegisterForm with all four states"
```

---

## Task 6: Route

**Files:**

- Create: `src/app/(auth)/signup/page.tsx`

- [ ] **Step 1: Create the route (thin RSC, mirrors login page)**

```tsx
// src/app/(auth)/signup/page.tsx
import { RegisterForm } from '@/modules/auth';

export default function SignupPage() {
  return <RegisterForm />;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(auth)/signup/page.tsx"
git commit -m "feat(auth): add /signup route"
```

---

## Task 7: Barrel exports

**Files:**

- Modify: `src/modules/auth/index.ts`

- [ ] **Step 1: Export the new public surface**

In `src/modules/auth/index.ts`, add the component export after `LoginForm`:

```ts
export { RegisterForm } from './components/RegisterForm';
```

Add the schema type export after the `LoginInput` export:

```ts
export type { RegisterInput } from './validations/register.schema';
```

Add `RegisterResponse` and `Tenant` to the existing `export type { ... } from './types/auth.types';` block:

```ts
export type {
  LoginResponse,
  MfaRequiredResponse,
  OtpInitiateResponse,
  RegisterResponse,
  Session,
  Tenant,
} from './types/auth.types';
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/index.ts
git commit -m "feat(auth): export RegisterForm and register types from module barrel"
```

---

## Task 8: Login → signup cross-link

**Files:**

- Modify: `src/modules/auth/components/LoginForm.tsx`

- [ ] **Step 1: Add a footer link below the form**

In `src/modules/auth/components/LoginForm.tsx`, add a footer link immediately **after** the closing `</form>` tag and **before** the final `</div>` of the component:

```tsx
{
  /* Footer link */
}
<p className="text-center text-sm text-fg-muted">
  Don&apos;t have an account?{' '}
  <Link
    href="/signup"
    className="text-brand hover:text-brand-hover transition-colors"
    tabIndex={isPending ? -1 : 0}
  >
    Create a company workspace
  </Link>
</p>;
```

(`Link` and `isPending` are already imported/in scope in this file.)

- [ ] **Step 2: Verify it compiles**

Run: `pnpm typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/modules/auth/components/LoginForm.tsx
git commit -m "feat(auth): link login page to company signup"
```

---

## Task 9: MSW handler (offline/demo fallback)

**Files:**

- Modify: `src/mocks/handlers/auth.ts`

Why: per `CLAUDE.md §22`, the FE ships against a mock matching the documented `§3`
shape until the backend ships `POST /auth/register`. The `GET /auth/me` mock returns
the just-registered user (so the post-signup redirect lands on a populated dashboard);
it **passes through to the live backend** when no mock registration has happened, so it
never breaks live login under mocks.

- [ ] **Step 1: Add `passthrough` to the import**

Change the first line of `src/mocks/handlers/auth.ts`:

```ts
import { http, HttpResponse, passthrough } from 'msw';
```

- [ ] **Step 2: Add the SUPER_ADMIN permission constant + session state above `export const authHandlers`**

```ts
// Explicit SUPER_ADMIN permission list — identical to GET /settings/roles-permissions
// (API_MAPPING.md). The register mock and the /auth/me mock both return this.
const SUPER_ADMIN_PERMISSIONS = [
  'employees:read',
  'employees:write',
  'employees:delete',
  'employees:export',
  'departments:read',
  'departments:write',
  'attendance:read',
  'attendance:write',
  'leave:read',
  'leave:request',
  'leave:approve',
  'analytics:read',
  'permissions:manage',
  'audit:read',
];

// Holds the user created by a mock POST /auth/register for this worker session, so
// the follow-up GET /auth/me resolves the new admin. null → /auth/me passes through.
let mockRegisteredUser: {
  id: string;
  email: string;
  memberType: 'SUPER_ADMIN';
  employeeId: null;
  status: string;
  employee: null;
  permissions: string[];
} | null = null;
```

- [ ] **Step 3: Add the two handlers inside the `authHandlers` array (after the existing otp/initiate handler)**

```ts
  // POST /api/auth/register — NOT built on backend yet (BACKEND_API_REQUESTS.md §3).
  http.post('/api/auth/register', async ({ request }) => {
    const body = (await request.json()) as {
      companyName?: string;
      fullName?: string;
      email?: string;
      password?: string;
    };

    // Fixed conflict fixture so the 409 path is testable.
    if (body.email?.toLowerCase() === 'taken@acme.test') {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'EMAIL_IN_USE',
            message: 'This email is already registered.',
            details: [],
            requestId: 'mock-register',
          },
        },
        { status: 409 },
      );
    }

    mockRegisteredUser = {
      id: 'usr_mock_admin',
      email: body.email ?? 'admin@acme.com',
      memberType: 'SUPER_ADMIN',
      employeeId: null,
      status: 'ACTIVE',
      employee: null,
      permissions: SUPER_ADMIN_PERMISSIONS,
    };

    return HttpResponse.json(
      {
        success: true,
        data: {
          accessToken: 'mock-access-token',
          sessionId: 'sess_mock',
          tenant: {
            id: 'ten_mock',
            name: body.companyName ?? 'New Company',
            country: null,
            currency: null,
            timezone: null,
          },
          user: {
            id: mockRegisteredUser.id,
            email: mockRegisteredUser.email,
            memberType: 'SUPER_ADMIN',
            employeeId: null,
            employee: null,
          },
          permissions: SUPER_ADMIN_PERMISSIONS,
        },
        meta: {},
      },
      { status: 201 },
    );
  }),

  // GET /api/auth/me — under mocks, return the just-registered admin so the
  // post-signup redirect lands authenticated. Otherwise defer to the live backend.
  http.get('/api/auth/me', () => {
    if (!mockRegisteredUser) return passthrough();
    return HttpResponse.json({ success: true, data: mockRegisteredUser, meta: {} });
  }),
```

- [ ] **Step 4: Verify it compiles and lints**

Run: `pnpm typecheck`
Expected: PASS.

Run: `pnpm lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/mocks/handlers/auth.ts
git commit -m "feat(auth): add MSW register + me mock for offline signup demo"
```

---

## Task 10: Full verification & manual smoke

**Files:** none (verification only).

- [ ] **Step 1: Run the full test gate**

Run: `pnpm typecheck`
Expected: PASS, no errors.

Run: `pnpm lint`
Expected: PASS, no warnings/errors in the new files.

Run: `pnpm test src/modules/auth/validations/register.schema.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 2: Manual smoke against the live backend (default, `NEXT_PUBLIC_USE_MOCKS=false`)**

Run: `pnpm dev`. Visit `http://localhost:3000/signup`.

- Verify the four fields render, light + dark mode, at 768 / 1280 / 1440 / 1920 px.
- Submit empty → inline "required" errors appear (no network call).
- Fill valid details and submit. **If the backend has shipped `/auth/register`:** lands on `/dashboard`. **If not yet:** expect a 404/network error surfaced as the general error banner — that is correct until backend ships; switch to mock mode (Step 3) to exercise the happy path now.

- [ ] **Step 3: Manual smoke in mock mode (`NEXT_PUBLIC_USE_MOCKS=true`)**

Set `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local`, restart `pnpm dev`.

- Submit `taken@acme.test` as email → inline "already registered" error on the email field (409 path).
- Submit any other valid details → redirect to `/dashboard`, AuthProvider shows the SUPER_ADMIN as signed in.
- Restore `NEXT_PUBLIC_USE_MOCKS=false` when done.

- [ ] **Step 4: Final commit (if any smoke fixes were needed)**

```bash
git add -A
git commit -m "test(auth): verify company signup flow end-to-end"
```

---

## Self-review notes

- **Spec coverage:** §3 screen (Task 5/6), §4 module wiring (Tasks 1–4, 7), §5 MSW/E2E (Task 9), all four states (Task 5: idle/submitting/error/success), cross-links (Tasks 5 & 8). ✓
- **Deferred items NOT built** (correct per scope): country/currency/timezone, password complexity, Terms checkbox, duplicate-company prevention. ✓
- **Type consistency:** `RegisterInput` (schema) used by hook + form + service object literal; `RegisterResponse` (extends `LoginResponse`) returned by service + hook; `/auth/me` mock matches the `User` type in `src/types/user.ts` (`id, email, memberType, employeeId, status, employee, permissions`). ✓
- **No new shadcn primitives, no raw hex, no `any`** (form casts to `keyof RegisterInput` for `setError`, same as `LoginForm`). ✓
