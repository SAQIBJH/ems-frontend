import { cn } from '@/lib/utils';

export function NoApprovalsIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-16', className)}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Inbox tray base */}
      <rect
        x="8"
        y="42"
        width="48"
        height="14"
        rx="3"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      {/* Inbox tray opening sides */}
      <path
        d="M8 42 L16 26 L48 26 L56 42"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.06"
      />
      {/* Checkmark (done / all clear) */}
      <circle
        cx="32"
        cy="24"
        r="12"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      <path
        d="M26 24 L30 28 L38 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
