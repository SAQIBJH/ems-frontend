import { cn } from '@/lib/utils';

export function NoTeamIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-16', className)}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Person 2 — behind, right side, lower opacity */}
      <circle
        cx="44"
        cy="22"
        r="8"
        fill="currentColor"
        fillOpacity="0.06"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.3"
      />
      <path
        d="M30 56 Q30 44 44 44 Q58 44 58 56"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.3"
        strokeLinecap="round"
        fill="currentColor"
        fillOpacity="0.04"
      />
      {/* Person 1 — foreground, left side */}
      <circle
        cx="24"
        cy="22"
        r="9"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.55"
      />
      <path
        d="M8 56 Q8 43 24 43 Q40 43 40 56"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.55"
        strokeLinecap="round"
        fill="currentColor"
        fillOpacity="0.06"
      />
    </svg>
  );
}
