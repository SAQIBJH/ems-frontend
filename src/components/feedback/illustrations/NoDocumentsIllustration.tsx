import { cn } from '@/lib/utils';

export function NoDocumentsIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-16', className)}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Back page (offset) */}
      <rect
        x="18"
        y="12"
        width="34"
        height="42"
        rx="3"
        fill="currentColor"
        fillOpacity="0.04"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.25"
      />
      {/* Front page */}
      <rect
        x="12"
        y="8"
        width="34"
        height="44"
        rx="3"
        fill="currentColor"
        fillOpacity="0.06"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      {/* Folded corner */}
      <path
        d="M34 8 L46 8 L46 20 Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.4"
        strokeLinejoin="round"
      />
      <path
        d="M34 8 L34 20 L46 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Content lines */}
      <line
        x1="18"
        y1="30"
        x2="38"
        y2="30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.25"
        strokeLinecap="round"
        strokeDasharray="4 3"
      />
      <line
        x1="18"
        y1="38"
        x2="34"
        y2="38"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.2"
        strokeLinecap="round"
        strokeDasharray="4 3"
      />
      <line
        x1="18"
        y1="46"
        x2="36"
        y2="46"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.15"
        strokeLinecap="round"
        strokeDasharray="4 3"
      />
    </svg>
  );
}
