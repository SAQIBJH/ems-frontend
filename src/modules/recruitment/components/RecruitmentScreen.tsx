'use client';

import { useState } from 'react';
import {
  BriefcaseIcon,
  UsersIcon,
  CalendarIcon,
  ClockIcon,
  DownloadIcon,
  PlusIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/data-display/StatsCard';
import { PageHeader } from '@/shared/layouts/PageHeader';

import { PipelineBoard } from './PipelineBoard';
import { OpeningsTable } from './OpeningsTable';
import { CandidatesTable } from './CandidatesTable';
import { PostJobDialog } from './PostJobDialog';
import {
  useRecruitmentSummary,
  useOpenings,
  useCandidates,
  useRecruiters,
} from '../hooks/useRecruitment';

export function RecruitmentScreen() {
  const [postJobOpen, setPostJobOpen] = useState(false);

  const summaryQuery = useRecruitmentSummary();
  const openingsQuery = useOpenings();
  const candidatesQuery = useCandidates();
  const recruitersQuery = useRecruiters();

  const summary = summaryQuery.data;
  const openings = openingsQuery.data?.openings ?? [];
  const candidates = candidatesQuery.data?.candidates ?? [];
  const recruiters = recruitersQuery.data?.recruiters ?? [];

  return (
    <>
      <PageHeader
        title="Recruitment"
        description="Track open requisitions and move candidates through the hiring pipeline."
        breadcrumbs={[{ label: 'Recruitment' }]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.success('Export started — your file will download shortly.')}
            >
              <DownloadIcon className="size-3.5" aria-hidden />
              Export
            </Button>
            <Button size="sm" onClick={() => setPostJobOpen(true)}>
              <PlusIcon className="size-3.5" aria-hidden />
              Post a Job
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-5 p-6">
        {/* Stats row — shared across all tabs */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard
            label="Open requisitions"
            value={summaryQuery.isLoading ? '—' : (summary?.openRequisitions ?? 0).toString()}
            icon={<BriefcaseIcon className="size-4" aria-hidden />}
            accent="var(--brand-500)"
            subLine={
              summary
                ? { text: `${summary.closingThisWeek} closing this week`, tone: 'neutral' }
                : undefined
            }
            loading={summaryQuery.isLoading}
          />
          <StatsCard
            label="Active candidates"
            value={summaryQuery.isLoading ? '—' : (summary?.activeCandidates ?? 0).toString()}
            icon={<UsersIcon className="size-4" aria-hidden />}
            accent="var(--dept-engineering)"
            subLine={summary ? { text: 'vs last month', tone: 'neutral' } : undefined}
            loading={summaryQuery.isLoading}
          />
          <StatsCard
            label="Interviews this week"
            value={summaryQuery.isLoading ? '—' : (summary?.interviewsThisWeek ?? 0).toString()}
            icon={<CalendarIcon className="size-4" aria-hidden />}
            accent="var(--warning-500)"
            subLine={
              summary ? { text: `${summary.interviewsToday} today`, tone: 'warning' } : undefined
            }
            loading={summaryQuery.isLoading}
          />
          <StatsCard
            label="Avg time to hire"
            value={summaryQuery.isLoading ? '—' : `${summary?.avgDaysToHire ?? 0}d`}
            icon={<ClockIcon className="size-4" aria-hidden />}
            accent="var(--success-500)"
            subLine={summary ? { text: '−4d vs Q1', tone: 'positive' } : undefined}
            loading={summaryQuery.isLoading}
          />
        </div>

        {/* Tabs — line variant matches design mock underline style */}
        <Tabs defaultValue="pipeline">
          <TabsList variant="line" className="mb-2 w-full justify-start">
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="openings">Openings</TabsTrigger>
            <TabsTrigger value="candidates">Candidates</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="mt-4">
            <PipelineBoard
              candidates={candidates}
              openings={openings}
              recruiters={recruiters}
              isLoading={candidatesQuery.isLoading}
              isError={candidatesQuery.isError}
              onRetry={() => void candidatesQuery.refetch()}
            />
          </TabsContent>

          <TabsContent value="openings" className="mt-4">
            <OpeningsTable
              openings={openings}
              isLoading={openingsQuery.isLoading}
              isError={openingsQuery.isError}
              onRetry={() => void openingsQuery.refetch()}
            />
          </TabsContent>

          <TabsContent value="candidates" className="mt-4">
            <CandidatesTable
              candidates={candidates}
              isLoading={candidatesQuery.isLoading}
              isError={candidatesQuery.isError}
              onRetry={() => void candidatesQuery.refetch()}
            />
          </TabsContent>
        </Tabs>
      </div>

      <PostJobDialog open={postJobOpen} onOpenChange={setPostJobOpen} />
    </>
  );
}
