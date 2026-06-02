import type { ReactNode } from 'react';

interface FormRowProps {
  label: string;
  help?: string;
  children: ReactNode;
}

export function FormRow({ label, help, children }: FormRowProps) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-6 py-5">
      <div className="pt-0.5">
        <p className="text-[13px] font-medium leading-[18px] text-fg">{label}</p>
        {help && <p className="mt-1 text-[12px] leading-[18px] text-fg-muted">{help}</p>}
      </div>
      <div className="flex max-w-[480px] flex-col gap-2">{children}</div>
    </div>
  );
}

interface PanelHeaderProps {
  section: string;
  title: string;
  description?: string;
}

export function PanelHeader({ section, title, description }: PanelHeaderProps) {
  return (
    <div className="border-b border-subtle pb-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-fg-subtle">
        {section}
      </p>
      <h2 className="mb-1.5 mt-1 text-[20px] font-semibold tracking-[-0.01em] text-fg">{title}</h2>
      {description && <p className="text-[13px] leading-5 text-fg-muted">{description}</p>}
    </div>
  );
}
