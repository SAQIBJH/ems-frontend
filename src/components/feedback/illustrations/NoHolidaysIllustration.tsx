import { cn } from '@/lib/utils';

export function NoHolidaysIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={cn('size-16', className)}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* Calendar body */}
      <rect
        x="8"
        y="14"
        width="48"
        height="42"
        rx="3"
        fill="currentColor"
        fillOpacity="0.06"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
      {/* Header band */}
      <rect x="8" y="14" width="48" height="13" rx="3" fill="currentColor" fillOpacity="0.12" />
      <line
        x1="8"
        y1="27"
        x2="56"
        y2="27"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      {/* Binding rings */}
      <line
        x1="22"
        y1="10"
        x2="22"
        y2="19"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.6"
        strokeLinecap="round"
      />
      <line
        x1="42"
        y1="10"
        x2="42"
        y2="19"
        stroke="currentColor"
        strokeWidth="2"
        strokeOpacity="0.6"
        strokeLinecap="round"
      />
      {/* Empty day dots (6 positions) */}
      {[20, 32, 44].map((cx) =>
        [38, 50].map((cy) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="2.5"
            fill="currentColor"
            fillOpacity="0.2"
          />
        )),
      )}
    </svg>
  );
}
