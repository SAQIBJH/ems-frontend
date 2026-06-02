import type { ReactNode } from 'react';

interface InfoRowProps {
  label: string;
  children: ReactNode;
}

/** A definition-table row: muted label on the left, value on the right.
 *  Use inside a SectionCard with noPad + a px-5 wrapper div. */
export function InfoRow({ label, children }: InfoRowProps) {
  return (
    <div className="flex items-start gap-4 border-b border-subtle py-2.5 last:border-0">
      <span className="w-40 shrink-0 text-sm text-fg-muted">{label}</span>
      <span className="flex-1 text-sm text-fg">{children ?? '—'}</span>
    </div>
  );
}
