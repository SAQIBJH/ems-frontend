import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { recruitmentApi } from '../services/recruitment.api';
import type { OpeningsParams, CandidatesParams } from '../types/recruitment.types';

export const RECRUITMENT_KEYS = {
  summary: ['recruitment', 'summary'] as const,
  openings: (params?: OpeningsParams) => ['recruitment', 'openings', params] as const,
  candidates: (params?: CandidatesParams) => ['recruitment', 'candidates', params] as const,
};

export function useRecruitmentSummary() {
  return useQuery({
    queryKey: RECRUITMENT_KEYS.summary,
    queryFn: () => recruitmentApi.getSummary(),
  });
}

export function useOpenings(params?: OpeningsParams) {
  return useQuery({
    queryKey: RECRUITMENT_KEYS.openings(params),
    queryFn: () => recruitmentApi.getOpenings(params),
  });
}

export function useCandidates(params?: CandidatesParams) {
  return useQuery({
    queryKey: RECRUITMENT_KEYS.candidates(params),
    queryFn: () => recruitmentApi.getCandidates(params),
  });
}

export function useAdvanceCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      recruitmentApi.advanceCandidate(id, stage),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['recruitment', 'candidates'] });
      void qc.invalidateQueries({ queryKey: ['recruitment', 'summary'] });
    },
  });
}

export function usePostJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recruitmentApi.postJob,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['recruitment', 'openings'] });
      void qc.invalidateQueries({ queryKey: ['recruitment', 'summary'] });
    },
  });
}
