import { cn } from '@/lib/utils';

export function NoDataIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-16', className)}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Document frame */}
      <rect
        x="10"
        y="8"
        width="44"
        height="48"
        rx="3"
        fill="currentColor"
        fillOpacity="0.06"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      {/* Header bar */}
      <rect x="10" y="8" width="44" height="13" rx="3" fill="currentColor" fillOpacity="0.1" />
      <line
        x1="10"
        y1="21"
        x2="54"
        y2="21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      {/* Empty row hints (dashed) */}
      <line
        x1="18"
        y1="32"
        x2="46"
        y2="32"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.25"
        strokeLinecap="round"
        strokeDasharray="5 3"
      />
      <line
        x1="18"
        y1="41"
        x2="40"
        y2="41"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.2"
        strokeLinecap="round"
        strokeDasharray="5 3"
      />
      <line
        x1="18"
        y1="50"
        x2="44"
        y2="50"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.15"
        strokeLinecap="round"
        strokeDasharray="5 3"
      />
    </svg>
  );
}
