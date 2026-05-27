import { ConstructionIcon } from 'lucide-react';

interface PlaceholderPanelProps {
  title: string;
  description: string;
  phase2?: boolean;
}

export function PlaceholderPanel({ title, description, phase2 = false }: PlaceholderPanelProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          {phase2 && (
            <span className="text-[0.625rem] font-semibold px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 leading-none">
              Phase 2
            </span>
          )}
        </div>
        <p className="text-sm text-fg-muted">{description}</p>
      </div>

      <div className="rounded-lg border border-dashed border-subtle bg-surface-raised/40 p-10 flex flex-col items-center gap-3 text-center">
        <div className="size-10 rounded-full bg-surface-raised flex items-center justify-center">
          <ConstructionIcon className="size-5 text-fg-disabled" />
        </div>
        <div>
          <p className="text-sm font-medium text-fg-subtle">Coming soon</p>
          <p className="text-xs text-fg-muted mt-0.5">
            {phase2
              ? 'This feature is planned for Phase 2 of the roadmap.'
              : 'This feature will be available in a future release.'}
          </p>
        </div>
      </div>
    </div>
  );
}
