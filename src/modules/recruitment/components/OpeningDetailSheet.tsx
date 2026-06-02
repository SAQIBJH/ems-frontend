'use client';

import { format, parseISO } from 'date-fns';
import { MapPinIcon, BriefcaseIcon, UsersIcon, CalendarIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { OPENING_STATUS_CONFIG, EMPLOYMENT_TYPE_LABELS } from '../constants';
import type { Opening } from '../types/recruitment.types';

interface OpeningDetailSheetProps {
  opening: Opening | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-subtle last:border-0">
      <span className="text-[12px] font-medium text-fg-muted w-32 shrink-0">{label}</span>
      <span className="text-[13px] text-fg flex-1 text-right">{children}</span>
    </div>
  );
}

export function OpeningDetailSheet({ opening, open, onOpenChange }: OpeningDetailSheetProps) {
  if (!opening) return null;

  const statusCfg = OPENING_STATUS_CONFIG[opening.status] ?? { variant: 'secondary' as const };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 py-4 border-b border-subtle">
          <SheetTitle className="text-base font-semibold text-fg">{opening.title}</SheetTitle>
          <p className="font-mono text-[11px] text-fg-muted mt-0.5">{opening.id}</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          {/* Status + Stage */}
          <div className="flex items-center gap-3 py-4 border-b border-subtle">
            <Badge variant={statusCfg.variant} dot={statusCfg.dot}>
              {opening.status}
            </Badge>
            <span className="text-[12px] text-fg-secondary">Stage: {opening.currentStage}</span>
          </div>

          {/* Details */}
          <div className="mt-1">
            <DetailRow label="Department">{opening.department}</DetailRow>
            <DetailRow label="Location">
              <span className="inline-flex items-center gap-1.5 justify-end">
                <MapPinIcon size={12} className="text-fg-muted shrink-0" aria-hidden />
                {opening.location}
              </span>
            </DetailRow>
            <DetailRow label="Employment type">
              <span className="inline-flex items-center gap-1.5 justify-end">
                <BriefcaseIcon size={12} className="text-fg-muted shrink-0" aria-hidden />
                {EMPLOYMENT_TYPE_LABELS[opening.employmentType] ?? opening.employmentType}
              </span>
            </DetailRow>
            <DetailRow label="Applicants">
              <span className="inline-flex items-center gap-1.5 justify-end">
                <UsersIcon size={12} className="text-fg-muted shrink-0" aria-hidden />
                {opening.applicantCount}
              </span>
            </DetailRow>
            <DetailRow label="Posted on">
              <span className="inline-flex items-center gap-1.5 justify-end">
                <CalendarIcon size={12} className="text-fg-muted shrink-0" aria-hidden />
                {format(parseISO(opening.createdAt), 'dd MMM yyyy')}
              </span>
            </DetailRow>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
