'use client';

import { useState, type CSSProperties } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { FilterIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { CandidateCard, RecruitDot } from './CandidateCard';
import type { Candidate, Opening, Recruiter } from '../types/recruitment.types';
import { RECRUIT_STAGES, STAGE_SEQUENCE } from '../constants';
import { useAdvanceCandidate } from '../hooks/useRecruitment';

/* ── Droppable column ────────────────────────────────────────────────────── */

function DroppableColumn({
  stageKey,
  stageLabel,
  stageColor,
  cards,
  isLoading,
  isOver,
}: {
  stageKey: string;
  stageLabel: string;
  stageColor: string;
  cards: Candidate[];
  isLoading: boolean;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: `col-${stageKey}` });

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex min-h-[120px] flex-col rounded-xl border transition-colors duration-[120ms]',
        isOver
          ? 'border-brand bg-brand-50/50 dark:bg-brand-500/10'
          : 'border-subtle bg-surface-raised',
      ].join(' ')}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 pb-[10px] pt-3">
        <span className="inline-flex items-center gap-2">
          <RecruitDot color={stageColor} />
          <span className="text-[12px] font-semibold uppercase leading-[16px] tracking-[0.04em] text-fg">
            {stageLabel}
          </span>
        </span>
        <span className="font-mono text-[12px] font-medium leading-[16px] text-fg-muted">
          {isLoading ? '—' : cards.length}
        </span>
      </div>

      {/* Column body */}
      <div className="flex flex-col gap-2 px-2 pb-2">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </>
        ) : cards.length === 0 ? (
          <p className="py-4 text-center text-[12px] leading-[16px] text-fg-disabled">
            No candidates
          </p>
        ) : (
          cards.map((c) => <DraggableCard key={c.id} candidate={c} />)
        )}
      </div>
    </div>
  );
}

/* ── Draggable card wrapper ──────────────────────────────────────────────── */

function DraggableCard({ candidate }: { candidate: Candidate }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: candidate.id,
    data: { candidate },
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <CandidateCard candidate={candidate} />
    </div>
  );
}

/* ── PipelineBoard ───────────────────────────────────────────────────────── */

interface PipelineBoardProps {
  candidates: Candidate[];
  openings: Opening[];
  recruiters: Recruiter[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function PipelineBoard({
  candidates,
  openings,
  recruiters,
  isLoading,
  isError,
  onRetry,
}: PipelineBoardProps) {
  const advanceMutation = useAdvanceCandidate();
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [filterOpeningId, setFilterOpeningId] = useState('all');
  const [filterRecruiterId, setFilterRecruiterId] = useState('all');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const visibleCandidates =
    filterOpeningId !== 'all'
      ? candidates.filter((c) => c.openingId === filterOpeningId)
      : candidates;

  const byStage = Object.fromEntries(
    RECRUIT_STAGES.map((s) => [s.key, visibleCandidates.filter((c) => c.stage === s.key)]),
  ) as Record<string, Candidate[]>;

  function handleDragStart(event: DragStartEvent) {
    const candidate = (event.active.data.current as { candidate: Candidate }).candidate;
    setActiveCandidate(candidate);
  }

  function handleDragOver(event: DragOverEvent) {
    setOverColumn(event.over ? String(event.over.id) : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveCandidate(null);
    setOverColumn(null);

    const { active, over } = event;
    if (!over) return;

    const candidateId = active.id as string;
    const targetColId = over.id as string;
    if (!targetColId.startsWith('col-')) return;
    const targetStage = targetColId.replace('col-', '');

    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate || candidate.stage === targetStage) return;

    const currentIdx = STAGE_SEQUENCE.indexOf(candidate.stage);
    const targetIdx = STAGE_SEQUENCE.indexOf(targetStage as (typeof STAGE_SEQUENCE)[number]);
    if (targetIdx <= currentIdx) {
      toast.error('Cannot move a candidate backwards.');
      return;
    }
    if (targetIdx > currentIdx + 1) {
      toast.error('Can only advance one stage at a time.');
      return;
    }

    advanceMutation.mutate(
      { id: candidateId, stage: targetStage },
      {
        onSuccess: () => toast.success(`${candidate.name} moved to ${targetStage}`),
        onError: () => toast.error('Failed to move candidate'),
      },
    );
  }

  if (isError) {
    return <ErrorState message="Failed to load pipeline" onRetry={onRetry} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[12px] font-medium leading-[16px] text-fg-secondary">Role</span>

        {/* Role / Opening filter — wider, shows title */}
        <div className="w-56">
          <Select value={filterOpeningId} onValueChange={(v) => setFilterOpeningId(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-full">
              <SelectValue>
                {(v: string) =>
                  v === 'all' ? 'All openings' : (openings.find((o) => o.id === v)?.title ?? v)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All openings</SelectItem>
              {openings.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Recruiter filter */}
        <div className="w-48">
          <Select value={filterRecruiterId} onValueChange={(v) => setFilterRecruiterId(v ?? 'all')}>
            <SelectTrigger size="sm" className="w-full">
              <SelectValue>
                {(v: string) =>
                  v === 'all' ? 'All recruiters' : (recruiters.find((r) => r.id === v)?.name ?? v)
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All recruiters</SelectItem>
              {recruiters.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFilterOpeningId('all');
            setFilterRecruiterId('all');
            toast.success('Filters cleared');
          }}
        >
          <FilterIcon className="size-3.5" aria-hidden />
          Clear filters
        </Button>
      </div>

      {/* Kanban board with DnD */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className="grid items-start gap-3 overflow-x-auto pb-1"
          style={{ gridTemplateColumns: 'repeat(5, minmax(200px, 1fr))' } as CSSProperties}
        >
          {RECRUIT_STAGES.map((stage) => (
            <DroppableColumn
              key={stage.key}
              stageKey={stage.key}
              stageLabel={stage.label}
              stageColor={stage.color}
              cards={byStage[stage.key] ?? []}
              isLoading={isLoading}
              isOver={overColumn === `col-${stage.key}`}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCandidate ? (
            <div style={{ cursor: 'grabbing', opacity: 0.9, width: 220 }}>
              <CandidateCard candidate={activeCandidate} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
