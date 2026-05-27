import type { LucideIcon } from 'lucide-react';
import { CheckIcon, RocketIcon } from 'lucide-react';

interface Phase2PanelProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** What this feature will unlock — shown as a bullet list. */
  capabilities: string[];
  /** Optional short note on Phase 2 timing / context. */
  roadmapNote?: string;
}

export function Phase2Panel({
  icon: Icon,
  title,
  description,
  capabilities,
  roadmapNote,
}: Phase2PanelProps) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Icon className="size-4 text-fg-subtle" />
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          <span className="text-[0.625rem] font-semibold px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 leading-none">
            Phase 2
          </span>
        </div>
        <p className="text-sm text-fg-muted">{description}</p>
      </div>

      {/* Feature preview card */}
      <div className="rounded-xl border border-subtle bg-surface-raised/40 overflow-hidden">
        {/* Banner */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-subtle bg-surface-raised/60">
          <RocketIcon className="size-3.5 text-warning shrink-0" />
          <p className="text-xs font-medium text-fg-subtle">
            Planned for Phase 2 — payroll, recruitment &amp; performance rollout
          </p>
        </div>

        {/* Capability list */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-fg-disabled mb-3">
            What&apos;s included
          </p>
          <ul className="space-y-2">
            {capabilities.map((cap) => (
              <li key={cap} className="flex items-start gap-2.5 text-sm text-fg-subtle">
                <CheckIcon className="size-3.5 mt-0.5 text-success shrink-0" />
                {cap}
              </li>
            ))}
          </ul>
        </div>

        {/* Roadmap note */}
        {roadmapNote && (
          <div className="px-5 pb-4">
            <p className="text-xs text-fg-disabled border-t border-subtle pt-3">{roadmapNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
