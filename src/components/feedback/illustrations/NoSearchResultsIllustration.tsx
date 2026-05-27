import { cn } from '@/lib/utils';

export function NoSearchResultsIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-16', className)}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Magnifying glass circle */}
      <circle
        cx="27"
        cy="27"
        r="17"
        fill="currentColor"
        fillOpacity="0.06"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      {/* Handle */}
      <line
        x1="39"
        y1="39"
        x2="54"
        y2="54"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
      {/* X inside circle — no results */}
      <line
        x1="20"
        y1="20"
        x2="34"
        y2="34"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.45"
        strokeLinecap="round"
      />
      <line
        x1="34"
        y1="20"
        x2="20"
        y2="34"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.45"
        strokeLinecap="round"
      />
    </svg>
  );
}
