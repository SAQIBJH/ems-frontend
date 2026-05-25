'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { Button } from '@/components/ui/button';
import type { ApiError } from '@/types/api';
import { authApi } from '../services/auth.api';
import { OtpInput } from './OtpInput';

const MAX_FAILURES = 5;

function useCountdown(targetIso: string | null) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!targetIso) return;
    function tick() {
      const diff = Math.max(0, Math.floor((new Date(targetIso!).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return secondsLeft;
}

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function OtpVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const challengeId = searchParams.get('challengeId') ?? '';

  const [otp, setOtp] = useState('');
  const [failures, setFailures] = useState(0);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = useState<string | null>(null);
  const initiatedRef = useRef(false);

  const resendCountdown = useCountdown(resendAvailableAt);
  const canResend = resendCountdown === 0;
  const isLockedOut = failures >= MAX_FAILURES;

  // initiate mutation — also used for resend
  const initiateMutation = useMutation<
    { challengeId: string; deliveryMethod: string; expiresAt: string; resendAvailableAt: string },
    AxiosError<ApiError>,
    string
  >({
    mutationFn: authApi.otpInitiate,
    onSuccess: (data) => {
      setResendAvailableAt(data.resendAvailableAt);
      setGeneralError(null);
    },
    onError: (err) => {
      const code = err.response?.data?.error?.code;
      if (code === 'RESEND_TOO_SOON') {
        setGeneralError('Please wait before requesting another code.');
      } else if (code === 'MAX_RESENDS') {
        setGeneralError('Maximum resend limit reached. Please start over.');
      } else {
        setGeneralError('Failed to send code. Please try again.');
      }
    },
  });

  // auto-initiate on mount
  useEffect(() => {
    if (!challengeId || initiatedRef.current) return;
    initiatedRef.current = true;
    initiateMutation.mutate(challengeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId]);

  const verifyMutation = useMutation<
    void,
    AxiosError<ApiError>,
    { challengeId: string; otp: string }
  >({
    mutationFn: async ({ challengeId: cid, otp: code }) => {
      await authApi.verifyOtp(cid, code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      router.push('/dashboard');
    },
    onError: (err) => {
      const code = err.response?.data?.error?.code;
      const newFailures = failures + 1;
      setFailures(newFailures);
      setOtp('');
      if (newFailures >= MAX_FAILURES) {
        setGeneralError('Too many failed attempts. Please start over.');
      } else if (code === 'OTP_EXPIRED') {
        setGeneralError('The code has expired. Request a new one below.');
      } else {
        setGeneralError(
          `Incorrect code. ${MAX_FAILURES - newFailures} attempt${MAX_FAILURES - newFailures === 1 ? '' : 's'} remaining.`,
        );
      }
    },
  });

  function submitOtp(code: string) {
    if (code.length < 6 || isLockedOut || verifyMutation.isPending) return;
    setGeneralError(null);
    verifyMutation.mutate({ challengeId, otp: code });
  }

  function handleOtpChange(newOtp: string) {
    setOtp(newOtp);
    // auto-submit on completion — called from event handler, not effect
    if (newOtp.length === 6) submitOtp(newOtp);
  }

  function handleSubmit() {
    submitOtp(otp);
  }

  if (!challengeId) {
    return (
      <div className="space-y-6">
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
        >
          Invalid verification link. Please sign in again.
        </div>
        <Link
          href="/login"
          className="block text-center text-sm text-brand hover:text-brand-hover transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Verify your identity</h1>
        <p className="mt-1 text-sm text-fg-muted">
          We sent a 6-digit code to your email. Enter it below to continue.
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

      {isLockedOut ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-fg-muted">
            Too many failed attempts. Please start the sign-in process again.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm font-medium text-brand hover:text-brand-hover transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="flex justify-center">
            <OtpInput
              value={otp}
              onChange={handleOtpChange}
              disabled={verifyMutation.isPending || initiateMutation.isPending}
              hasError={!!generalError}
            />
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={otp.length < 6 || verifyMutation.isPending}
            className="w-full"
          >
            {verifyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                Verifying…
              </>
            ) : (
              'Verify and continue'
            )}
          </Button>

          <p className="text-center text-sm text-fg-muted">
            Didn&apos;t receive a code?{' '}
            {canResend ? (
              <button
                type="button"
                onClick={() => initiateMutation.mutate(challengeId)}
                disabled={initiateMutation.isPending}
                className="text-brand hover:text-brand-hover underline underline-offset-2 transition-colors disabled:opacity-50"
              >
                {initiateMutation.isPending ? 'Sending…' : 'Resend code'}
              </button>
            ) : (
              <span className="tabular-nums">Resend in {formatCountdown(resendCountdown)}</span>
            )}
          </p>
        </>
      )}

      <Link
        href="/login"
        className="flex items-center justify-center text-sm text-fg-muted hover:text-fg transition-colors"
      >
        Back to sign in
      </Link>
    </div>
  );
}
