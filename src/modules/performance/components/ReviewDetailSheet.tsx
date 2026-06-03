'use client';

import { useState, type CSSProperties } from 'react';
import { CheckIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Review, RatingValue } from '../types/performance.types';
import { REVIEW_STATUS_CONFIG, RATING_CONFIG } from '../constants';
import { useSubmitReview } from '../hooks/usePerformance';

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const RATING_OPTIONS: RatingValue[] = ['Exceeds', 'Strong', 'Meets', 'Developing', 'Below'];

interface ReviewDetailSheetProps {
  review: Review | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-subtle py-3 last:border-0">
      <span className="w-36 shrink-0 text-[12px] font-medium text-fg-muted">{label}</span>
      <span className="flex-1 text-right text-[13px] text-fg">{children}</span>
    </div>
  );
}

function StatusCheck({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div
        className="grid size-5 shrink-0 place-items-center rounded-full"
        style={
          {
            background: done
              ? 'color-mix(in oklab, var(--success-500) 14%, transparent)'
              : 'var(--bg-surface-2)',
          } as CSSProperties
        }
      >
        {done ? (
          <CheckIcon
            size={11}
            style={{ color: 'var(--success-500)' } as CSSProperties}
            aria-hidden
          />
        ) : (
          <span
            className="block size-1.5 rounded-full"
            style={{ background: 'var(--text-disabled)' } as CSSProperties}
          />
        )}
      </div>
      <span className="text-[13px] text-fg">{label}</span>
      <Badge variant={done ? 'success' : 'secondary'} className="ml-auto">
        {done ? 'Complete' : 'Pending'}
      </Badge>
    </div>
  );
}

export function ReviewDetailSheet({ review, open, onOpenChange }: ReviewDetailSheetProps) {
  const [selectedRating, setSelectedRating] = useState<RatingValue | null>(null);
  const submitReview = useSubmitReview();

  if (!review) return null;

  const statusCfg = REVIEW_STATUS_CONFIG[review.status];
  const isManagerReview = review.status === 'Manager review';
  const initials = getInitials(review.employeeName);

  function handleSubmit() {
    if (!selectedRating) return;
    submitReview.mutate(
      { employeeId: review!.employeeId, input: { rating: selectedRating } },
      {
        onSuccess: () => {
          toast.success(`Review submitted — ${review!.employeeName} rated ${selectedRating}`);
          setSelectedRating(null);
          onOpenChange(false);
        },
        onError: () => toast.error('Failed to submit review'),
      },
    );
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) setSelectedRating(null);
        onOpenChange(o);
      }}
    >
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-subtle px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-base font-semibold text-fg">
                {review.employeeName}
              </SheetTitle>
              <p className="text-[12px] text-fg-muted">{review.department}</p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          {/* Status badge */}
          <div className="flex items-center gap-3 border-b border-subtle py-4">
            <span
              className="inline-flex items-center gap-1.5 text-[13px] font-medium"
              style={{ color: statusCfg.color } as CSSProperties}
            >
              <span
                className="inline-block size-[7px] shrink-0 rounded-full"
                style={{ background: statusCfg.color } as CSSProperties}
                aria-hidden
              />
              {review.status}
            </span>
          </div>

          {/* Details */}
          <div className="mt-1">
            <DetailRow label="Reviewer">{review.reviewerName}</DetailRow>
            {review.rating && (
              <DetailRow label="Rating">
                <span
                  className="font-medium"
                  style={{ color: RATING_CONFIG[review.rating].color } as CSSProperties}
                >
                  {review.rating}
                </span>
              </DetailRow>
            )}
          </div>

          {/* Completion status */}
          <div className="mt-4 rounded-lg border border-subtle p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-fg-muted">
              Review progress
            </p>
            <StatusCheck done={review.selfComplete} label="Self review" />
            <StatusCheck done={review.managerComplete} label="Manager review" />
          </div>

          {/* Manager review form */}
          {isManagerReview && (
            <div className="mt-4 rounded-lg border border-subtle p-4">
              <p className="mb-3 text-[12px] font-semibold text-fg">Submit rating</p>
              <div className="flex flex-wrap gap-2">
                {RATING_OPTIONS.map((r) => {
                  const cfg = RATING_CONFIG[r];
                  const isSelected = selectedRating === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRating(r)}
                      className="rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      style={
                        {
                          borderColor: isSelected ? cfg.color : 'var(--border-default)',
                          background: isSelected
                            ? `color-mix(in oklab, ${cfg.color} 12%, transparent)`
                            : 'transparent',
                          color: isSelected ? cfg.color : 'var(--text-secondary)',
                        } as CSSProperties
                      }
                    >
                      {r}
                    </button>
                  );
                })}
              </div>

              <Button
                className="mt-4 w-full"
                disabled={!selectedRating || submitReview.isPending}
                onClick={handleSubmit}
              >
                {submitReview.isPending ? 'Submitting…' : 'Submit review'}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
