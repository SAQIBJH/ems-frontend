'use client';

import { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  hasError?: boolean;
}

export function OtpInput({ value, onChange, length = 6, disabled, hasError }: OtpInputProps) {
  const cells = Array.from({ length });
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const focus = useCallback((index: number) => {
    inputsRef.current[index]?.focus();
  }, []);

  function handleChange(index: number, char: string) {
    const digit = char.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    const arr = value.split('');
    arr[index] = digit;
    const next = arr.join('').slice(0, length);
    onChange(next);
    if (index < length - 1) focus(index + 1);
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const arr = value.split('');
      if (arr[index]) {
        arr[index] = '';
        onChange(arr.join(''));
      } else if (index > 0) {
        const prev = index - 1;
        arr[prev] = '';
        onChange(arr.join(''));
        focus(prev);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      focus(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      focus(index + 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!digits) return;
    onChange(digits.padEnd(value.length > digits.length ? value.length : 0, '').slice(0, length));
    const nextIndex = Math.min(digits.length, length - 1);
    focus(nextIndex);
  }

  return (
    <div role="group" aria-label="One-time password" className="flex items-center gap-2">
      {cells.map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] ?? ''}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${length}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'flex size-11 items-center justify-center rounded-md border text-center text-lg font-semibold tabular-nums',
            'border-subtle bg-surface text-fg',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand',
            'disabled:cursor-not-allowed disabled:opacity-50',
            hasError && 'border-danger focus:ring-danger/30 focus:border-danger',
            value[i] && !hasError && 'border-brand/60 bg-brand-50/30',
          )}
        />
      ))}
    </div>
  );
}
